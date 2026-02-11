/**
 * 08 - Edge Full WASM Toolkit (Browser-First)
 *
 * @ruvector/edge-full is a browser-first WASM toolkit:
 *   - HNSW vector search
 *   - Graph DB (Cypher)
 *   - DAG workflow engine
 *   - SONA neural router
 *   - Ed25519 + AES-256-GCM crypto
 *   - ONNX embeddings
 *
 * These modules load via fetch() which works in browsers
 * but not Node.js out of the box. This example shows the
 * API patterns for browser integration.
 *
 * For Node.js: use @ruvector/rvlite (examples 01-05) or
 * @ruvector/graph-node (example 07) instead.
 *
 * Run:  npm run edge  (shows API docs, browser usage patterns)
 */

console.log(`
=== @ruvector/edge-full ===
Complete WASM toolkit for edge AI (~8.4MB)

Modules:
  1. edge/    - Identity (Ed25519), Crypto (AES-256-GCM), HNSW index, Raft consensus
  2. graph/   - Property graph with Cypher queries
  3. rvlite/  - Multi-query vector DB (SQL, SPARQL, Cypher)
  4. sona/    - Self-Optimizing Neural Architecture (LoRA, routing)
  5. dag/     - Directed acyclic graph workflow engine
  6. onnx/    - HuggingFace model embeddings (6 models)

Browser Usage:
  <script type="module">
    import { initAll } from '@ruvector/edge-full';
    const { edge, graph, rvlite, sona, dag } = await initAll();
  </script>

Or load selectively:
  import { initModules } from '@ruvector/edge-full';
  const { edge, graph } = await initModules(['edge', 'graph']);
`);

// Show what's available in the package
try {
  const pkg = await import("@ruvector/edge-full");
  const exports = Object.keys(pkg).filter(k => k !== "default");
  console.log("Available exports:", exports.join(", ") || "(default only)");
} catch (e) {
  console.log("Package available but modules need browser fetch() for WASM init.");
}

console.log(`
=== API Quick Reference ===

// 1. HNSW Vector Search
const index = new WasmHnswIndex(384, 16, 200);  // dims, M, efConstruction
index.add(0, embedding);
const neighbors = index.search(queryVector, 10);

// 2. Graph Database
const store = new WasmGraphStore();
store.run_cypher("CREATE (n:Grant {title: 'Water Infrastructure'})");
store.run_cypher("MATCH (g:Grant) RETURN g");

// 3. DAG Workflow
const workflow = new Dag();
workflow.add_node("submit");
workflow.add_node("review");
workflow.add_edge("submit", "review");
console.log(workflow.topological_sort());

// 4. SONA Neural Router
const engine = new SonaEngine();
const decision = engine.route_request({
  task: "review code",
  context: { language: "rust" }
});

// 5. ONNX Embeddings
const embedder = new WasmEmbedder();
await embedder.load_model('bge-small-en-v1.5');
const vector = await embedder.embed("Grant proposal text");

// 6. Crypto
const identity = WasmIdentity.generate();
const sig = identity.sign(data);
const valid = identity.verify(data, sig);

For working Node.js examples, see:
  01-basic-vectors.mjs  - Vector search with rvlite WASM
  02-sql-queries.mjs    - SQL vector queries
  03-sparql-triples.mjs - RDF knowledge graph
  04-cypher-graph.mjs   - Property graph
  07-graph-node.mjs     - Native graph DB (10x faster)
`);
