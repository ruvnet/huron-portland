# 06 - Graph Neural Network Inference

Multi-head attention, tensor compression, and differentiable search using `@ruvector/gnn`.

## Run

```bash
cd ruvector
npm run gnn
```

## Prerequisites

This example requires **native NAPI-RS bindings**. Supported platforms:
- Linux x64 / arm64
- macOS x64 / arm64
- Windows x64

If bindings are not available for your platform, the example exits with an informational message.

## What This Example Does

1. Creates a GNN layer with multi-head attention (4 heads)
2. Runs a forward pass with node + neighbor embeddings
3. Serializes and restores the layer from JSON
4. Demonstrates adaptive tensor compression at different access frequencies
5. Performs differentiable search over candidate embeddings

## Key Concepts

### Graph Neural Networks (GNNs)

GNNs learn node representations by aggregating information from neighboring nodes. The `RuvectorLayer` implements multi-head attention over graph neighborhoods.

### Tensor Compression

`TensorCompress` adaptively compresses embeddings based on how frequently they're accessed. Rarely-accessed embeddings get heavier compression to save memory.

### Differentiable Search

`differentiableSearch` uses soft attention over candidate embeddings, making the search operation differentiable (gradient-friendly) for end-to-end training.

## Step-by-Step Walkthrough

### 1. Import (with Graceful Fallback)

```javascript
let RuvectorLayer, TensorCompress, differentiableSearch, getCompressionLevel;

try {
  const mod = await import("@ruvector/gnn");
  ({ RuvectorLayer, TensorCompress, differentiableSearch, getCompressionLevel } = mod);
} catch (e) {
  console.error("@ruvector/gnn requires native bindings (NAPI-RS).");
  process.exit(1);
}
```

### 2. GNN Forward Pass

```javascript
const layer = new RuvectorLayer(
  64,   // inputDim
  32,   // hiddenDim
  4,    // attention heads
  0.1   // dropout rate
);

const nodeEmbedding = randVec(64);
const neighborEmbeddings = [randVec(64), randVec(64), randVec(64)];
const edgeWeights = [0.8, 0.5, 0.3];

const output = layer.forward(nodeEmbedding, neighborEmbeddings, edgeWeights);
// output.length === hiddenDim (32)
```

The forward pass:
1. Projects node and neighbors through attention heads
2. Computes attention scores weighted by edge weights
3. Aggregates neighbor information
4. Returns a `hiddenDim`-dimensional output

### 3. Serialization

```javascript
const json = layer.toJson();                    // Serialize to JSON string
const restored = RuvectorLayer.fromJson(json);  // Restore from JSON
```

### 4. Tensor Compression

```javascript
const compressor = new TensorCompress();
const embedding = randVec(128);

for (const freq of [0.01, 0.1, 0.5, 0.9, 0.99]) {
  const level = getCompressionLevel(freq);  // "aggressive", "standard", "light", etc.
  const compressed = compressor.compress(embedding, freq);
  const decompressed = compressor.decompress(compressed);
}
```

| Access Frequency | Compression Level | Use Case |
|-----------------|-------------------|----------|
| 0.01 (rare) | aggressive | Archived embeddings |
| 0.10 | heavy | Infrequent lookups |
| 0.50 | standard | Average usage |
| 0.90 | light | Frequent access |
| 0.99 (hot) | minimal | Real-time serving |

### 5. Differentiable Search

```javascript
const query = randVec(64);
const candidates = Array.from({ length: 20 }, () => ({
  embedding: randVec(64),
}));

const results = differentiableSearch(
  query,
  candidates.map(c => c.embedding),
  5,     // topK
  0.1    // temperature (lower = sharper)
);

for (const r of results) {
  console.log(r.index, r.score);
}
```

Temperature controls attention sharpness:
- `0.01` - nearly hard selection (highest score wins)
- `0.1` - sharp but differentiable
- `1.0` - uniform (all candidates weighted equally)

## API Reference

### RuvectorLayer

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(inputDim, hiddenDim, heads, dropout)` | Create layer |
| `forward` | `(node, neighbors[], edgeWeights[])` | Forward pass |
| `toJson` | `()` | Serialize |
| `fromJson` | `(json)` | Deserialize (static) |

### TensorCompress

| Method | Signature | Description |
|--------|-----------|-------------|
| `compress` | `(embedding, frequency)` | Compress adaptively |
| `decompress` | `(compressed)` | Restore embedding |

### Standalone Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `getCompressionLevel` | `(frequency)` | Get level name |
| `differentiableSearch` | `(query, candidates, topK, temp)` | Soft attention search |

## Common Pitfalls

1. **Platform dependency** - Native bindings are platform-specific. The package will fail to load on unsupported platforms.
2. **Dimension consistency** - All input vectors must match `inputDim` exactly.
3. **Edge weights** - Must have the same length as `neighborEmbeddings` array.
4. **Temperature** - Very low values (< 0.001) may cause numerical instability.
