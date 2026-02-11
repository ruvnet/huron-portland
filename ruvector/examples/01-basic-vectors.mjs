/**
 * 01 - Basic Vector Operations
 *
 * Demonstrates insert, search, and metadata filtering
 * using @ruvector/rvlite WASM engine.
 *
 * Run:  npm run basic
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

// --- Create a 128-dimension database with cosine similarity ---
const config = new RvLiteConfig(128);
const db = new RvLite(config);

console.log("RvLite version:", db.get_version());
console.log("Features:", db.get_features());

// --- Helper: deterministic pseudo-embedding ---
function embed(seed) {
  const vec = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    vec[i] = Math.sin(seed * (i + 1) * 0.1);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  for (let i = 0; i < 128; i++) vec[i] /= norm;
  return vec;
}

// Helper: convert Map metadata to plain object
function meta(entry) {
  if (entry.metadata instanceof Map) return Object.fromEntries(entry.metadata);
  return entry.metadata || {};
}

// --- Insert vectors with metadata ---
const docs = [
  { title: "Grant Application Guide", category: "docs", seed: 1 },
  { title: "Budget Template 2026", category: "finance", seed: 2 },
  { title: "Community Health Program", category: "health", seed: 3 },
  { title: "Infrastructure Repair Fund", category: "infrastructure", seed: 4 },
  { title: "Youth Education Initiative", category: "education", seed: 5 },
  { title: "Water Quality Monitoring", category: "environment", seed: 6 },
  { title: "Small Business Recovery Grant", category: "finance", seed: 7 },
  { title: "Public Transit Expansion", category: "infrastructure", seed: 8 },
];

for (const doc of docs) {
  const id = db.insert(embed(doc.seed), {
    title: doc.title,
    category: doc.category,
  });
  console.log(`Inserted: ${doc.title}  (id=${id})`);
}

console.log(`\nTotal vectors: ${db.len()}`);

// --- Search: find documents similar to "infrastructure" ---
console.log("\n--- Top 3 nearest to seed=4 (Infrastructure) ---");
const results = db.search(embed(4), 3);
for (const r of results) {
  const m = meta(r);
  console.log(`  ${m.title || r.id}  (score: ${r.score.toFixed(4)})`);
}

// --- Filtered search: only "finance" category ---
console.log("\n--- Finance category only (top 2) ---");
const filtered = db.search_with_filter(embed(2), 2, { category: "finance" });
for (const r of filtered) {
  const m = meta(r);
  console.log(`  ${m.title || r.id}  (score: ${r.score.toFixed(4)})`);
}

// --- Retrieve by ID ---
const first = db.get(results[0].id);
console.log("\n--- Retrieved entry ---");
console.log("  ID:", first.id);
console.log("  Metadata:", JSON.stringify(meta(first)));

// --- Delete ---
db.delete(results[0].id);
console.log(`\nAfter delete, total vectors: ${db.len()}`);

// --- Insert with custom ID ---
db.insert_with_id("custom-001", embed(42), { title: "Custom Grant", category: "special" });
const custom = db.get("custom-001");
console.log("\n--- Custom ID entry ---");
console.log("  ID:", custom.id);
console.log("  Metadata:", JSON.stringify(meta(custom)));
