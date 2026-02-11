/**
 * 09 - RuVector Core
 *
 * Uses the main `ruvector` package - high-performance
 * vector database for Node.js with native/WASM fallback.
 * Includes GNN, SONA, attention, and code analysis.
 *
 * REQUIRES: Native bindings (falls back to WASM if available)
 *
 * Run:  npm run ruvector
 */

let ruvector;

try {
  ruvector = await import("ruvector");
} catch (e) {
  console.error("Failed to load ruvector:", e.message);
  process.exit(1);
}

// List available exports by category
const exports = Object.keys(ruvector).filter(k => k !== "default" && k !== "__esModule" && k !== "module.exports");
console.log(`ruvector v${ruvector.getVersion?.() || "?"} - ${exports.length} exports\n`);

// Categorize exports
const categories = {
  "Vector DB": ["VectorDB", "VectorDb", "NativeVectorDb", "VectorOps"],
  "GNN": ["RuvectorLayer", "TensorCompress", "differentiableSearch", "hierarchicalForward"],
  "SONA": ["Sona", "SonaEngine", "SemanticRouter"],
  "Attention": ["FlashAttention", "MultiHeadAttention", "DotProductAttention", "HyperbolicAttention"],
  "Embeddings": ["EmbeddingService", "OnnxEmbedder", "AdaptiveEmbedder", "embed", "embedBatch"],
  "Code Analysis": ["CodeParser", "CodeGraph", "buildGraph", "analyzeFile", "analyzeFiles"],
  "Intelligence": ["IntelligenceEngine", "LearningEngine", "NeuralSubstrate"],
  "Clustering": ["RuvectorCluster", "louvainCommunities", "spectralClustering"],
};

for (const [cat, keys] of Object.entries(categories)) {
  const available = keys.filter(k => ruvector[k]);
  if (available.length) {
    console.log(`${cat}: ${available.join(", ")}`);
  }
}

// ===== 1. Vector Database =====
console.log("\n=== Vector Database ===\n");

try {
  const { VectorDB } = ruvector;
  const db = new VectorDB({ dimensions: 128, distanceMetric: "Cosine" });
  console.log("VectorDB created (128 dims, Cosine)");
  console.log("Backend:", ruvector.isNative?.() ? "native" : ruvector.isWasm?.() ? "wasm" : "unknown");

  // Insert vectors
  const embed = (text) => {
    const vec = new Float32Array(128);
    for (let i = 0; i < text.length; i++) {
      vec[(text.charCodeAt(i) * 31 + i * 7) % 128] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm > 0) for (let j = 0; j < 128; j++) vec[j] /= norm;
    return vec;
  };

  const proposals = ["Water Infrastructure", "Youth Education", "Housing Fund", "Solar Energy"];
  for (const p of proposals) {
    await db.insert(embed(p), { title: p });
    console.log(`  Indexed: ${p}`);
  }
} catch (e) {
  console.log("VectorDB error:", e.message);
}

// ===== 2. Tensor Compression (GNN) =====
console.log("\n=== Tensor Compression ===\n");

try {
  const { TensorCompress, getCompressionLevel } = ruvector;
  if (TensorCompress) {
    const compressor = new TensorCompress();
    const vec = Array.from({ length: 64 }, () => Math.random());
    for (const freq of [0.01, 0.5, 0.99]) {
      const level = getCompressionLevel(freq);
      console.log(`  freq=${freq.toFixed(2)} -> ${level}`);
    }
  } else {
    console.log("  TensorCompress not available (needs native GNN bindings)");
  }
} catch (e) {
  console.log("  GNN error:", e.message);
}

// ===== 3. Cosine Similarity =====
console.log("\n=== Vector Operations ===\n");

try {
  const { cosineSimilarity, similarity } = ruvector;
  const fn = cosineSimilarity || similarity;
  if (fn) {
    const a = new Float32Array([1, 0, 0, 0]);
    const b = new Float32Array([1, 1, 0, 0]);
    const c = new Float32Array([0, 0, 0, 1]);
    console.log(`  sim(a, b) = ${fn(a, b).toFixed(4)}`);
    console.log(`  sim(a, c) = ${fn(a, c).toFixed(4)}`);
    console.log(`  sim(b, c) = ${fn(b, c).toFixed(4)}`);
  }
} catch (e) {
  console.log("  Similarity error:", e.message);
}

// ===== 4. Version & Features =====
console.log("\n=== System Info ===");
console.log("  Native:", ruvector.isNative?.() ?? "?");
console.log("  WASM:", ruvector.isWasm?.() ?? "?");
console.log("  GNN:", ruvector.isGnnAvailable?.() ?? "?");
console.log("  Graph:", ruvector.isGraphAvailable?.() ?? "?");
console.log("  ONNX:", ruvector.isOnnxAvailable?.() ?? "?");
console.log("  SONA:", ruvector.isSonaAvailable?.() ?? "?");
console.log("  Attention:", ruvector.isAttentionAvailable?.() ?? "?");

console.log("\nDone.");
