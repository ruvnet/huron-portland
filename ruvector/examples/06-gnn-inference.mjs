/**
 * 06 - Graph Neural Network Inference
 *
 * Uses @ruvector/gnn for multi-head attention,
 * tensor compression, and differentiable search.
 *
 * Run:  npm run gnn
 */

let RuvectorLayer, TensorCompress, differentiableSearch, getCompressionLevel;

try {
  const mod = await import("@ruvector/gnn");
  ({ RuvectorLayer, TensorCompress, differentiableSearch, getCompressionLevel } = mod);
} catch (e) {
  console.error("@ruvector/gnn requires native bindings (NAPI-RS).");
  console.error("Supported: Linux x64/arm64, macOS x64/arm64, Windows x64.");
  console.error("Error:", e.message);
  process.exit(1);
}

// --- Helper: random float array ---
function randVec(dim) {
  return Array.from({ length: dim }, () => Math.random() * 2 - 1);
}

// ===== 1. GNN Layer Forward Pass =====
console.log("=== GNN Layer Forward Pass ===\n");

const inputDim = 64;
const hiddenDim = 32;
const heads = 4;
const dropout = 0.1;

const layer = new RuvectorLayer(inputDim, hiddenDim, heads, dropout);

// Simulate a node with 3 neighbors
const nodeEmbedding = randVec(inputDim);
const neighborEmbeddings = [randVec(inputDim), randVec(inputDim), randVec(inputDim)];
const edgeWeights = [0.8, 0.5, 0.3];

const output = layer.forward(nodeEmbedding, neighborEmbeddings, edgeWeights);
console.log(`Input dim: ${inputDim}, Output dim: ${output.length}`);
console.log(`Output (first 8): [${output.slice(0, 8).map(v => v.toFixed(4)).join(", ")}...]`);

// Serialize / deserialize
const json = layer.toJson();
console.log(`Serialized layer: ${json.length} chars`);
const restored = RuvectorLayer.fromJson(json);
console.log("Layer restored from JSON.\n");

// ===== 2. Tensor Compression =====
console.log("=== Tensor Compression ===\n");

const compressor = new TensorCompress();
const embedding = randVec(128);

// Adaptive compression based on access frequency
const frequencies = [0.01, 0.1, 0.5, 0.9, 0.99];
for (const freq of frequencies) {
  const level = getCompressionLevel(freq);
  const compressed = compressor.compress(embedding, freq);
  const decompressed = compressor.decompress(compressed);
  console.log(
    `Access freq ${freq.toFixed(2)} → ${level.padEnd(14)} | ` +
    `Compressed: ${JSON.stringify(compressed).length} bytes | ` +
    `Recovered dims: ${decompressed.length}`
  );
}

// ===== 3. Differentiable Search =====
console.log("\n=== Differentiable Search ===\n");

const query = randVec(64);
const candidates = Array.from({ length: 20 }, (_, i) => ({
  id: `grant-${String(i).padStart(3, "0")}`,
  embedding: randVec(64),
}));

const topK = 5;
const temperature = 0.1; // lower = sharper attention

const results = differentiableSearch(
  query,
  candidates.map(c => c.embedding),
  topK,
  temperature
);

console.log(`Query vector dim: ${query.length}`);
console.log(`Candidates: ${candidates.length}`);
console.log(`Top ${topK} results (temperature=${temperature}):`);
for (const r of results) {
  const name = candidates[r.index]?.id ?? `idx-${r.index}`;
  console.log(`  ${name}  score: ${r.score.toFixed(4)}`);
}

console.log("\nDone.");
