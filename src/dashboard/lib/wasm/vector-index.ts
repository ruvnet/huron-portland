import { loadRvlite, type RvliteInstance } from "./rvlite-loader";
import type { Proposal, SearchResult } from "../types";

function simpleEmbed(text: string): number[] {
  const vec = new Array(384).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * 31 + i * 7 + j * 13) % 384;
      vec[idx] += 1.0 / words.length;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

let indexReady = false;
let rvlite: RvliteInstance | null = null;
let proposalMap: Map<string, Proposal> = new Map();

export async function buildIndex(proposals: Proposal[]): Promise<void> {
  rvlite = await loadRvlite();
  proposalMap = new Map();
  for (const p of proposals) {
    const text = `${p.title} ${p.description} ${p.tags.join(" ")} ${p.department} ${p.sponsor}`;
    const embedding = simpleEmbed(text);
    rvlite.addVector(p.id, embedding);
    proposalMap.set(p.id, p);
  }
  indexReady = true;
  console.log(`[vector-index] Indexed ${proposals.length} proposals`);
}

export async function vectorSearch(
  query: string,
  topK = 5,
  threshold = 0.1,
): Promise<SearchResult[]> {
  if (!indexReady || !rvlite) {
    throw new Error("Vector index not built. Call buildIndex() first.");
  }
  const queryVec = simpleEmbed(query);
  const results = rvlite.search(queryVec, topK);
  return results
    .filter((r) => r.score >= threshold)
    .map((r) => ({
      proposal: proposalMap.get(r.id)!,
      similarity: r.score,
    }))
    .filter((r) => r.proposal);
}

export function isIndexReady(): boolean {
  return indexReady;
}
