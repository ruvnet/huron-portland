# 08 - Edge Full WASM Toolkit (Browser-First)

Complete browser-first WASM toolkit for edge AI using `@ruvector/edge-full`.

## Run

```bash
cd ruvector
npm run edge
```

## Important Note

`@ruvector/edge-full` is designed for **browser environments**. All WASM modules load via `fetch()`, which doesn't work in Node.js out of the box. The example shows API patterns and documentation rather than running actual WASM operations.

**For Node.js vector operations**, use examples 01-05 (`@ruvector/rvlite`) or example 07 (`@ruvector/graph-node`).

## Package Overview

`@ruvector/edge-full` (~8.4MB) bundles 6 WASM modules into a single package for browser-based AI:

| Module | Exports | Description |
|--------|---------|-------------|
| `edge/` | `WasmIdentity`, `WasmCrypto`, `WasmHnswIndex`, `WasmRaft` | Identity (Ed25519), Crypto (AES-256-GCM), HNSW index, Raft consensus |
| `graph/` | `WasmGraphStore` | Property graph with Cypher queries |
| `rvlite/` | `RvLite`, `RvLiteConfig` | Multi-query vector DB (SQL, SPARQL, Cypher) |
| `sona/` | `SonaEngine` | Self-Optimizing Neural Architecture (LoRA, routing) |
| `dag/` | `Dag` | Directed acyclic graph workflow engine |
| `onnx/` | `WasmEmbedder` | HuggingFace model embeddings (6 models) |

## Browser Integration

### Load All Modules

```html
<script type="module">
  import { initAll } from '@ruvector/edge-full';
  const { edge, graph, rvlite, sona, dag } = await initAll();
</script>
```

### Load Selectively

```html
<script type="module">
  import { initModules } from '@ruvector/edge-full';
  const { edge, graph } = await initModules(['edge', 'graph']);
</script>
```

Selective loading reduces initial load time by only downloading the WASM modules you need.

## API Quick Reference

### 1. HNSW Vector Search

```javascript
const index = new WasmHnswIndex(384, 16, 200);
//                               dims  M   efConstruction

index.add(0, embedding);                    // Add vector with ID
const neighbors = index.search(queryVec, 10); // Find 10 nearest
```

Parameters:
- `dims` - Vector dimensions (must match your embedding model)
- `M` - Max connections per node (16 is a good default)
- `efConstruction` - Build-time search depth (higher = better quality, slower build)

### 2. Graph Database (Cypher)

```javascript
const store = new WasmGraphStore();
store.run_cypher("CREATE (n:Grant {title: 'Water Infrastructure'})");
const result = store.run_cypher("MATCH (g:Grant) RETURN g");
```

### 3. DAG Workflow Engine

```javascript
const workflow = new Dag();
workflow.add_node("submit");
workflow.add_node("review");
workflow.add_node("approve");
workflow.add_edge("submit", "review");
workflow.add_edge("review", "approve");

const order = workflow.topological_sort();
// ["submit", "review", "approve"]
```

Use for modeling multi-step grant approval workflows with dependency ordering.

### 4. SONA Neural Router

```javascript
const engine = new SonaEngine();
const decision = engine.route_request({
  task: "review code",
  context: { language: "rust" }
});
```

SONA (Self-Optimizing Neural Architecture) routes tasks to the optimal handler based on learned patterns.

### 5. ONNX Embeddings

```javascript
const embedder = new WasmEmbedder();
await embedder.load_model('bge-small-en-v1.5');
const vector = await embedder.embed("Grant proposal text");
```

Supported models:
- `bge-small-en-v1.5` (384 dims, fast)
- `all-MiniLM-L6-v2` (384 dims, general purpose)
- `nomic-embed-text-v1` (768 dims, high quality)
- And 3 more

### 6. Cryptography

```javascript
// Ed25519 identity
const identity = WasmIdentity.generate();
const sig = identity.sign(data);
const valid = identity.verify(data, sig);

// AES-256-GCM encryption
const crypto = new WasmCrypto(key);
const encrypted = crypto.encrypt(plaintext);
const decrypted = crypto.decrypt(encrypted);
```

## Use Cases for Portland Grants

| Use Case | Modules | Description |
|----------|---------|-------------|
| Proposal search | rvlite + onnx | Embed proposals, search by meaning |
| Grant workflows | dag | Model approval pipelines |
| Relationship graph | graph | Track dept/sponsor/grant connections |
| Secure submissions | edge (crypto) | Sign and encrypt grant documents |
| Smart routing | sona | Route proposals to right reviewers |
| Offline search | edge (hnsw) | Fast vector search without server |

## Architecture: Browser vs Node.js

```
Browser (edge-full)          Node.js (alternatives)
─────────────────           ────────────────────
edge-full/edge/   ←→        No direct equivalent
edge-full/graph/  ←→        @ruvector/graph-node (07)
edge-full/rvlite/ ←→        @ruvector/rvlite (01-05)
edge-full/sona/   ←→        ruvector SONA (09)
edge-full/dag/    ←→        No direct equivalent
edge-full/onnx/   ←→        ruvector OnnxEmbedder (09)
```

## Common Pitfalls

1. **Browser only** - All modules use `fetch()` for WASM loading. No Node.js support without custom loaders.
2. **Package size** - ~8.4MB total. Use `initModules()` to load only what you need.
3. **Async initialization** - `initAll()` and `initModules()` are async. Always `await`.
4. **CORS** - When serving locally, ensure your dev server supports WASM MIME types.
