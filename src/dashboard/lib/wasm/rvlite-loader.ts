export interface RvliteInstance {
  addVector(id: string, embedding: number[]): void;
  search(query: number[], topK: number): { id: string; score: number }[];
  size(): number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

class JsFallbackIndex implements RvliteInstance {
  private vectors: Map<string, number[]> = new Map();

  addVector(id: string, embedding: number[]): void {
    this.vectors.set(id, embedding);
  }

  search(query: number[], topK: number): { id: string; score: number }[] {
    const results: { id: string; score: number }[] = [];
    this.vectors.forEach((vec, id) => {
      results.push({ id, score: cosineSimilarity(query, vec) });
    });
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  size(): number {
    return this.vectors.size;
  }
}

let instance: RvliteInstance | null = null;

export async function loadRvlite(): Promise<RvliteInstance> {
  if (instance) return instance;

  try {
    // Dynamic import hidden from webpack static analysis
    const moduleName = ["@ruvector", "rvlite"].join("/");
    const mod = await (Function("m", "return import(m)")(moduleName) as Promise<Record<string, unknown>>);
    if (mod && typeof mod.createIndex === "function") {
      instance = await (mod.createIndex as (opts: { dimensions: number }) => Promise<RvliteInstance>)({ dimensions: 384 });
      console.log("[rvlite] WASM backend loaded");
      return instance;
    }
  } catch {
    console.log("[rvlite] WASM not available, using JS fallback");
  }

  instance = new JsFallbackIndex();
  return instance;
}

export function getRvlite(): RvliteInstance | null {
  return instance;
}
