# 09 - RuVector Core

The main `ruvector` meta-package with 151 exports for high-performance AI/ML in Node.js.

## Run

```bash
cd ruvector
npm run ruvector
```

## What This Example Does

1. Lists all 151 exports across 8 categories
2. Creates a VectorDB instance with native bindings
3. Tests tensor compression (GNN)
4. Computes cosine similarity between vectors
5. Shows system feature detection

## Package Overview

`ruvector` is the **meta-package** that bundles everything: vector database, graph neural networks, neural routing, attention mechanisms, embeddings, code analysis, intelligence engine, and clustering.

### Categories (151 exports)

| Category | Key Exports | Description |
|----------|-------------|-------------|
| **Vector DB** | `VectorDB`, `VectorDb`, `NativeVectorDb`, `VectorOps` | Core vector database |
| **GNN** | `RuvectorLayer`, `TensorCompress`, `differentiableSearch`, `hierarchicalForward` | Graph neural networks |
| **SONA** | `Sona`, `SonaEngine`, `SemanticRouter` | Self-optimizing neural architecture |
| **Attention** | `FlashAttention`, `MultiHeadAttention`, `DotProductAttention`, `HyperbolicAttention` | Attention mechanisms |
| **Embeddings** | `EmbeddingService`, `OnnxEmbedder`, `AdaptiveEmbedder`, `embed`, `embedBatch` | Vector embeddings |
| **Code Analysis** | `CodeParser`, `CodeGraph`, `buildGraph`, `analyzeFile`, `analyzeFiles` | Source code analysis |
| **Intelligence** | `IntelligenceEngine`, `LearningEngine`, `NeuralSubstrate` | AI reasoning engine |
| **Clustering** | `RuvectorCluster`, `louvainCommunities`, `spectralClustering` | Graph clustering |

### Feature Detection

```javascript
ruvector.isNative?.()          // true if native bindings loaded
ruvector.isWasm?.()            // true if WASM fallback active
ruvector.isGnnAvailable?.()    // true if GNN bindings present
ruvector.isGraphAvailable?.()  // true if graph-node available
ruvector.isOnnxAvailable?.()   // true if ONNX runtime loaded
ruvector.isSonaAvailable?.()   // true if SONA engine ready
ruvector.isAttentionAvailable?.() // true if attention modules loaded
```

## Step-by-Step Walkthrough

### 1. Import

```javascript
let ruvector;
try {
  ruvector = await import("ruvector");
} catch (e) {
  console.error("Failed to load ruvector:", e.message);
  process.exit(1);
}
```

### 2. VectorDB

```javascript
const { VectorDB } = ruvector;
const db = new VectorDB({ dimensions: 128, distanceMetric: "Cosine" });

// Check backend
const backend = ruvector.isNative?.() ? "native" : "wasm";

// Create embeddings
function embed(text) {
  const vec = new Float32Array(128);
  for (let i = 0; i < text.length; i++) {
    vec[(text.charCodeAt(i) * 31 + i * 7) % 128] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) for (let j = 0; j < 128; j++) vec[j] /= norm;
  return vec;
}

// Insert
await db.insert(embed("Water Infrastructure"), { title: "Water Infrastructure" });
```

**Note:** The native VectorDB may have serialization issues with `Float32Array`. If you get "Dimension mismatch: expected 128, got 0", use `@ruvector/rvlite` or `@ruvector/graph-node` instead.

### 3. Tensor Compression (GNN)

```javascript
const { TensorCompress, getCompressionLevel } = ruvector;
if (TensorCompress) {
  const compressor = new TensorCompress();
  const level = getCompressionLevel(0.5);  // "standard"
}
```

Requires `@ruvector/gnn` native bindings. Falls back gracefully if not available.

### 4. Cosine Similarity

```javascript
const { cosineSimilarity } = ruvector;

const a = new Float32Array([1, 0, 0, 0]);
const b = new Float32Array([1, 1, 0, 0]);
const c = new Float32Array([0, 0, 0, 1]);

console.log(cosineSimilarity(a, b));  // 0.7071 (similar)
console.log(cosineSimilarity(a, c));  // 0.0000 (orthogonal)
console.log(cosineSimilarity(b, c));  // 0.0000 (orthogonal)
```

### 5. Version Info

```javascript
console.log(ruvector.getVersion?.());  // version object
```

## System Info Output

```
=== System Info ===
  Native: true
  WASM: false
  GNN: false       (needs @ruvector/gnn native bindings)
  Graph: true
  ONNX: true
  SONA: true
  Attention: true
```

## When to Use `ruvector` vs Individual Packages

| Scenario | Recommendation |
|----------|---------------|
| Just need vector search | `@ruvector/rvlite` (lighter, WASM) |
| Need graph DB only | `@ruvector/graph-node` (native, fast) |
| Need GNN operations | `@ruvector/gnn` (native) |
| Browser deployment | `@ruvector/edge-full` (WASM bundle) |
| Full AI stack in Node.js | **`ruvector`** (everything) |
| Minimal dependencies | Individual packages |

## Available Modules by Feature Flag

| Feature | Module | When Available |
|---------|--------|---------------|
| VectorDB | Core | Always |
| VectorOps (cosine, etc.) | Core | Always |
| FlashAttention | Attention | Always (JS impl) |
| SONA/SemanticRouter | SONA | Always |
| EmbeddingService | Embeddings | Always |
| CodeParser/CodeGraph | Code Analysis | Always |
| IntelligenceEngine | Intelligence | Always |
| Clustering | Clustering | Always |
| TensorCompress | GNN | Only with native bindings |
| RuvectorLayer | GNN | Only with native bindings |
| GraphDatabase | Graph | Only with native bindings |
| OnnxEmbedder | ONNX | Only with ONNX runtime |

## Common Pitfalls

1. **Native vs WASM** - `ruvector` prefers native bindings. Check `isNative()` to know which backend loaded.
2. **GNN requires native** - `TensorCompress` and `RuvectorLayer` need platform-specific bindings.
3. **VectorDB Float32Array** - Native backend may have serialization issues. Wrap inserts in try/catch.
4. **Process hangs** - Native bindings can hold the event loop. The example completes output but may not exit cleanly.
5. **151 exports** - Many exports exist. Use feature detection (`isXxxAvailable()`) before accessing optional modules.
