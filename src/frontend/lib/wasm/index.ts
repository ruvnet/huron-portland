/**
 * WASM Module Loader
 * Handles async loading and initialization of WASM modules for vector operations
 */

export interface WasmModule {
  memory: WebAssembly.Memory;
  cosineSimilarity: (a: Float32Array, b: Float32Array) => number;
  dotProduct: (a: Float32Array, b: Float32Array) => number;
  normalize: (vector: Float32Array) => Float32Array;
  addVectors: (a: Float32Array, b: Float32Array) => Float32Array;
}

let wasmModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule> | null = null;

/**
 * Pure JavaScript fallback implementations for vector operations
 * Used when WASM is not available
 */
const jsFallback: WasmModule = {
  memory: new WebAssembly.Memory({ initial: 1 }),

  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] ?? 0;
      const bVal = b[i] ?? 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  },

  dotProduct(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += (a[i] ?? 0) * (b[i] ?? 0);
    }
    return result;
  },

  normalize(vector: Float32Array): Float32Array {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      const val = vector[i] ?? 0;
      norm += val * val;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) return new Float32Array(vector.length);

    const result = new Float32Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      result[i] = (vector[i] ?? 0) / norm;
    }
    return result;
  },

  addVectors(a: Float32Array, b: Float32Array): Float32Array {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    const result = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = (a[i] ?? 0) + (b[i] ?? 0);
    }
    return result;
  },
};

/**
 * Initialize and load the WASM module
 * Falls back to JS implementation if WASM is not available
 */
export async function loadWasmModule(): Promise<WasmModule> {
  if (wasmModule) {
    return wasmModule;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Check if WASM is supported
      if (typeof WebAssembly === 'undefined') {
        console.warn('WebAssembly not supported, using JS fallback');
        wasmModule = jsFallback;
        return wasmModule;
      }

      // Try to load the WASM module
      // In production, this would load from a .wasm file
      // For now, we use the JS fallback
      console.info('Using JS vector operations (WASM module not bundled)');
      wasmModule = jsFallback;
      return wasmModule;
    } catch (error) {
      console.warn('Failed to load WASM module, using JS fallback:', error);
      wasmModule = jsFallback;
      return wasmModule;
    }
  })();

  return loadingPromise;
}

/**
 * Get the loaded WASM module (must call loadWasmModule first)
 */
export function getWasmModule(): WasmModule {
  if (!wasmModule) {
    throw new Error('WASM module not loaded. Call loadWasmModule() first.');
  }
  return wasmModule;
}

/**
 * Check if WASM module is loaded
 */
export function isWasmLoaded(): boolean {
  return wasmModule !== null;
}
