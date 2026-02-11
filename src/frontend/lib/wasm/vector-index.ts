/**
 * Client-side Vector Index for Offline-First Search
 * Uses WASM for fast vector operations with IndexedDB persistence
 */

import { loadWasmModule, type WasmModule } from './index';

export interface VectorEntry {
  id: string;
  vector: Float32Array;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

const DB_NAME = 'huron-vector-store';
const DB_VERSION = 1;
const STORE_NAME = 'vectors';

class VectorIndex {
  private wasm: WasmModule | null = null;
  private db: IDBDatabase | null = null;
  private inMemoryIndex: Map<string, VectorEntry> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load WASM module
    this.wasm = await loadWasmModule();

    // Initialize IndexedDB
    if (typeof indexedDB !== 'undefined') {
      try {
        this.db = await this.openDatabase();
        await this.loadFromDatabase();
      } catch (error) {
        console.warn('IndexedDB not available, using in-memory only:', error);
      }
    }

    this.initialized = true;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result as Array<{
          id: string;
          vector: number[];
          metadata: Record<string, unknown>;
        }>;

        for (const entry of entries) {
          this.inMemoryIndex.set(entry.id, {
            id: entry.id,
            vector: new Float32Array(entry.vector),
            metadata: entry.metadata,
          });
        }
        resolve();
      };
    });
  }

  async addVector(
    id: string,
    vector: number[] | Float32Array,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.ensureInitialized();

    const floatVector = vector instanceof Float32Array
      ? vector
      : new Float32Array(vector);

    // Normalize the vector
    const normalizedVector = this.wasm!.normalize(floatVector);

    const entry: VectorEntry = {
      id,
      vector: normalizedVector,
      metadata,
    };

    this.inMemoryIndex.set(id, entry);

    // Persist to IndexedDB
    if (this.db) {
      await this.saveToDatabase(entry);
    }
  }

  private async saveToDatabase(entry: VectorEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put({
        id: entry.id,
        vector: Array.from(entry.vector),
        metadata: entry.metadata,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeVector(id: string): Promise<void> {
    await this.ensureInitialized();

    this.inMemoryIndex.delete(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  async search(
    queryVector: number[] | Float32Array,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<SearchResult[]> {
    await this.ensureInitialized();

    const { limit = 10, threshold = 0.0 } = options;

    const floatQuery = queryVector instanceof Float32Array
      ? queryVector
      : new Float32Array(queryVector);

    const normalizedQuery = this.wasm!.normalize(floatQuery);

    const results: SearchResult[] = [];

    const entries = Array.from(this.inMemoryIndex.values());
    for (const entry of entries) {
      const score = this.wasm!.cosineSimilarity(normalizedQuery, entry.vector);

      if (score >= threshold) {
        results.push({
          id: entry.id,
          score,
          metadata: entry.metadata,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();

    this.inMemoryIndex.clear();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  async syncFromServer(
    vectors: Array<{ id: string; vector: number[]; metadata: Record<string, unknown> }>
  ): Promise<number> {
    await this.ensureInitialized();

    let synced = 0;
    for (const item of vectors) {
      await this.addVector(item.id, item.vector, item.metadata);
      synced++;
    }

    return synced;
  }

  getStats(): { count: number; initialized: boolean } {
    return {
      count: this.inMemoryIndex.size,
      initialized: this.initialized,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Singleton instance
export const vectorIndex = new VectorIndex();
