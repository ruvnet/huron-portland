/**
 * WASM Loader for RVLite
 *
 * Enables client-side vector search and offline-first patterns
 * using WebAssembly for high-performance browser-based operations.
 */

// Type definitions for rvlite WASM module
interface RVLiteWASM {
  init(): Promise<void>;
  createIndex(dimensions: number, metric: 'cosine' | 'euclidean' | 'dot'): number;
  addVector(indexId: number, vector: Float32Array, id: string): void;
  search(indexId: number, query: Float32Array, k: number): SearchResult[];
  serialize(indexId: number): Uint8Array;
  deserialize(data: Uint8Array): number;
  deleteIndex(indexId: number): void;
}

interface SearchResult {
  id: string;
  distance: number;
  score: number;
}

interface CachedDocument {
  id: string;
  embedding: Float32Array;
  metadata: Record<string, unknown>;
  timestamp: number;
}

interface OfflineQueueItem {
  type: 'add' | 'delete' | 'update';
  documentId: string;
  data?: unknown;
  timestamp: number;
}

// Global WASM module instance
let wasmModule: RVLiteWASM | null = null;
let isInitialized = false;

// IndexedDB database name
const DB_NAME = 'huron-grants-offline';
const STORE_DOCUMENTS = 'documents';
const STORE_INDEX = 'vector-index';
const STORE_QUEUE = 'sync-queue';

/**
 * Initialize the RVLite WASM module
 * Loads the WebAssembly binary and initializes the vector search engine
 */
export async function initWASM(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Dynamic import of rvlite WASM module
    const rvlite = await import('rvlite/wasm');
    wasmModule = rvlite.default as RVLiteWASM;

    // Initialize the WASM runtime
    await wasmModule.init();

    isInitialized = true;
    console.log('[RVLite] WASM module initialized successfully');
  } catch (error) {
    console.error('[RVLite] Failed to initialize WASM module:', error);
    throw new Error('Failed to initialize client-side vector search');
  }
}

/**
 * Ensures WASM module is initialized before use
 */
async function ensureInitialized(): Promise<RVLiteWASM> {
  if (!isInitialized || !wasmModule) {
    await initWASM();
  }
  if (!wasmModule) {
    throw new Error('WASM module failed to initialize');
  }
  return wasmModule;
}

/**
 * Client-side vector index manager
 * Handles offline-first vector search with sync capabilities
 */
export class ClientVectorIndex {
  private indexId: number | null = null;
  private dimensions: number;
  private metric: 'cosine' | 'euclidean' | 'dot';
  private db: IDBDatabase | null = null;

  constructor(
    dimensions: number = 1536,
    metric: 'cosine' | 'euclidean' | 'dot' = 'cosine'
  ) {
    this.dimensions = dimensions;
    this.metric = metric;
  }

  /**
   * Initialize the client-side index
   * Restores from IndexedDB if available
   */
  async initialize(): Promise<void> {
    const wasm = await ensureInitialized();

    // Open IndexedDB
    this.db = await this.openDatabase();

    // Try to restore existing index
    const savedIndex = await this.loadSavedIndex();

    if (savedIndex) {
      this.indexId = wasm.deserialize(savedIndex);
      console.log('[RVLite] Restored index from IndexedDB');
    } else {
      this.indexId = wasm.createIndex(this.dimensions, this.metric);
      console.log('[RVLite] Created new index');
    }
  }

  /**
   * Add a document to the client-side index
   */
  async addDocument(
    id: string,
    embedding: number[] | Float32Array,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const wasm = await ensureInitialized();

    if (this.indexId === null) {
      await this.initialize();
    }

    const vector = embedding instanceof Float32Array
      ? embedding
      : new Float32Array(embedding);

    wasm.addVector(this.indexId!, vector, id);

    // Cache document in IndexedDB
    await this.cacheDocument({
      id,
      embedding: vector,
      metadata,
      timestamp: Date.now(),
    });

    // Queue for server sync
    await this.queueForSync({
      type: 'add',
      documentId: id,
      data: { embedding: Array.from(vector), metadata },
      timestamp: Date.now(),
    });
  }

  /**
   * Search for similar documents
   */
  async search(
    query: number[] | Float32Array,
    k: number = 10
  ): Promise<SearchResult[]> {
    const wasm = await ensureInitialized();

    if (this.indexId === null) {
      await this.initialize();
    }

    const queryVector = query instanceof Float32Array
      ? query
      : new Float32Array(query);

    return wasm.search(this.indexId!, queryVector, k);
  }

  /**
   * Persist index to IndexedDB
   */
  async persist(): Promise<void> {
    const wasm = await ensureInitialized();

    if (this.indexId === null) {
      return;
    }

    const serialized = wasm.serialize(this.indexId);
    await this.saveIndex(serialized);
    console.log('[RVLite] Index persisted to IndexedDB');
  }

  /**
   * Sync pending changes with server
   */
  async syncWithServer(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) {
      console.log('[RVLite] Offline - sync deferred');
      return { synced: 0, failed: 0 };
    }

    const queue = await this.getQueuedItems();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await this.syncItem(item);
        await this.removeFromQueue(item.documentId);
        synced++;
      } catch (error) {
        console.error(`[RVLite] Failed to sync ${item.documentId}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (wasmModule && this.indexId !== null) {
      await this.persist();
      wasmModule.deleteIndex(this.indexId);
      this.indexId = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Private helper methods

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
          db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_INDEX)) {
          db.createObjectStore(STORE_INDEX, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'documentId' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async loadSavedIndex(): Promise<Uint8Array | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_INDEX, 'readonly');
      const store = tx.objectStore(STORE_INDEX);
      const request = store.get('main-index');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  private async saveIndex(data: Uint8Array): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_INDEX, 'readwrite');
      const store = tx.objectStore(STORE_INDEX);
      const request = store.put({ key: 'main-index', data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async cacheDocument(doc: CachedDocument): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const request = store.put(doc);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async queueForSync(item: OfflineQueueItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getQueuedItems(): Promise<OfflineQueueItem[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async removeFromQueue(documentId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const request = store.delete(documentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async syncItem(item: OfflineQueueItem): Promise<void> {
    // Integration point with server API
    const endpoint = '/api/vectors/sync';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }
}

/**
 * Register service worker for offline support
 */
export async function registerOfflineSupport(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[RVLite] Service worker registered:', registration.scope);

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('[RVLite] Back online - triggering sync');
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync?.register('vector-sync');
        });
      });
    } catch (error) {
      console.error('[RVLite] Service worker registration failed:', error);
    }
  }
}

/**
 * Create singleton instance for app-wide use
 */
let defaultIndex: ClientVectorIndex | null = null;

export async function getDefaultIndex(): Promise<ClientVectorIndex> {
  if (!defaultIndex) {
    defaultIndex = new ClientVectorIndex();
    await defaultIndex.initialize();
  }
  return defaultIndex;
}

// Export types
export type { RVLiteWASM, SearchResult, CachedDocument, OfflineQueueItem };
