# RuVector Examples - Huron Portland Hackathon

High-performance vector database and graph engine examples using the RuVector ecosystem. These examples demonstrate semantic search, knowledge graphs, and AI/ML capabilities for Portland's grants management system.

## Prerequisites

- **Node.js** 20+ (ES modules required)
- **npm** 9+
- Windows x64, macOS x64/arm64, or Linux x64/arm64

## Quick Start

```bash
cd ruvector
npm install
npm run basic      # 01 - Vector insert/search/filter
npm run sql        # 02 - SQL vector queries
npm run sparql     # 03 - RDF triples & SPARQL
npm run cypher     # 04 - Property graph & Cypher
npm run grants     # 05 - Portland grants semantic search
npm run gnn        # 06 - Graph Neural Network (native only)
npm run graph-node # 07 - Native graph database
npm run edge       # 08 - Browser WASM toolkit (API reference)
npm run ruvector   # 09 - RuVector core (151 exports)
npm run lifecycle  # 10 - Grant lifecycle tracker
npm run matching   # 11 - Grant matching & recommendations
npm run compliance # 12 - Compliance & audit trail
npm run portfolio  # 13 - Portfolio analytics dashboard
npm run dedup      # 14 - Deduplication & overlap detection
```

## Packages

| Package | Version | Type | Size | Description |
|---------|---------|------|------|-------------|
| [@ruvector/rvlite](https://www.npmjs.com/package/@ruvector/rvlite) | 0.2.4 | WASM | ~850KB | Standalone vector DB with SQL, SPARQL, Cypher |
| [ruvector](https://www.npmjs.com/package/ruvector) | 0.1.96 | Native+WASM | varies | Meta-package: VectorDB, GNN, SONA, Attention, Embeddings |
| [@ruvector/gnn](https://www.npmjs.com/package/@ruvector/gnn) | 0.1.22 | Native (NAPI-RS) | ~2MB | Graph Neural Network layers, tensor compression |
| [@ruvector/graph-node](https://www.npmjs.com/package/@ruvector/graph-node) | 0.1.26 | Native (NAPI-RS) | ~3MB | Graph DB with Cypher, hypergraph, persistence |
| [@ruvector/edge-full](https://www.npmjs.com/package/@ruvector/edge-full) | 0.1.0 | WASM (browser) | ~8.4MB | Complete browser toolkit: HNSW, Graph, DAG, SONA, ONNX, Crypto |

### Package Decision Guide

| Need | Use | Examples |
|------|-----|----------|
| Vector search in Node.js | `@ruvector/rvlite` | 01-05 |
| SQL/SPARQL/Cypher queries | `@ruvector/rvlite` | 02-04 |
| Native graph DB (10x faster) | `@ruvector/graph-node` | 07 |
| GNN / tensor operations | `@ruvector/gnn` | 06 |
| Browser-based AI | `@ruvector/edge-full` | 08 |
| Full Node.js AI stack | `ruvector` | 09 |

## Examples Overview

### 01 - Basic Vectors ([details](docs/01-basic-vectors.md))
Insert vectors with metadata, search by similarity, filter by metadata fields, retrieve by ID, delete entries, and use custom IDs. The foundation for all vector operations.

### 02 - SQL Vector Search ([details](docs/02-sql-queries.md))
Create vector-enabled SQL tables and query with `ORDER BY v <-> [query]` syntax for similarity search. Demonstrates typed result values and multi-query patterns.

### 03 - SPARQL & RDF Triples ([details](docs/03-sparql-triples.md))
Model Portland's grants as an RDF knowledge graph with semantic triples. Query relationships between grants, departments, and sponsors using SPARQL.

### 04 - Cypher Property Graph ([details](docs/04-cypher-graph.md))
Build a Neo4j-style property graph with labeled nodes (Departments, Sponsors, Grants), typed relationships (SPONSORS, BELONGS_TO, PARTNERS_WITH), and graph statistics.

### 05 - Grants Semantic Search ([details](docs/05-grants-search.md))
Full-featured semantic search over 10 Portland grant proposals with text embeddings, multi-query search, and department-filtered results.

### 06 - GNN Inference ([details](docs/06-gnn-inference.md))
Graph Neural Network forward pass with multi-head attention, adaptive tensor compression, and differentiable search. Requires native bindings.

### 07 - Native Graph Database ([details](docs/07-graph-node.md))
High-performance native graph database with async operations, Cypher queries, hyperedge support, and database statistics. 10x faster than WASM.

### 08 - Edge Full WASM Toolkit ([details](docs/08-edge-full.md))
Browser-first WASM toolkit with 6 modules: HNSW vector search, Graph DB, DAG workflows, SONA neural routing, ONNX embeddings, and Ed25519 crypto.

### 09 - RuVector Core ([details](docs/09-ruvector-core.md))
The main `ruvector` meta-package with 151 exports across 8 categories: VectorDB, GNN, SONA, FlashAttention, Embeddings, Code Analysis, Intelligence, and Clustering.

---

### Huron Grant Management Examples

### 10 - Grant Lifecycle Tracker ([details](docs/10-grant-lifecycle.md))
Track grants through 8 lifecycle stages (Draft to Completed) with organizational structure, milestone progress bars, and automated risk alerts. Models Huron teams, reviewers, and client relationships.

### 11 - Grant Matching & Recommendations ([details](docs/11-grant-matching.md))
Match 8 federal funding opportunities to 7 Portland department capability profiles. Forward match (department -> opportunities) and reverse match (opportunity -> best department) with pipeline valuation.

### 12 - Compliance & Audit Trail ([details](docs/12-compliance-audit.md))
Track 2 CFR 200 compliance across grants with RDF triples, log audit events with semantic search, and generate compliance dashboards. Includes realistic findings for procurement, cost, and reporting.

### 13 - Portfolio Analytics Dashboard ([details](docs/13-portfolio-analytics.md))
Comprehensive analytics across 10 grants using 3 simultaneous RvLite databases (vector, SQL, graph). Executive summary, department/funder breakdowns, drawdown analysis, risk heatmap, and financial profile matching.

### 14 - Grant Deduplication & Overlap Detection ([details](docs/14-grant-dedup.md))
Detect duplicate and overlapping grant submissions across departments using pairwise vector similarity. Flags double-dipping risks and identifies cross-department coordination opportunities.

## Architecture

```
ruvector/
  package.json                # Dependencies and npm scripts
  examples/
    lib/
      wasm-loader.mjs         # Node.js WASM initialization helper
    01-basic-vectors.mjs      # @ruvector/rvlite - vector CRUD
    02-sql-queries.mjs        # @ruvector/rvlite - SQL interface
    03-sparql-triples.mjs     # @ruvector/rvlite - RDF/SPARQL
    04-cypher-graph.mjs       # @ruvector/rvlite - Cypher graph
    05-grants-search.mjs      # @ruvector/rvlite - domain search
    06-gnn-inference.mjs      # @ruvector/gnn - neural network
    07-graph-node.mjs         # @ruvector/graph-node - native graph
    08-edge-full.mjs          # @ruvector/edge-full - browser WASM
    09-ruvector-core.mjs      # ruvector - full AI stack
    10-grant-lifecycle.mjs    # Huron lifecycle tracker
    11-grant-matching.mjs     # Huron matching engine
    12-compliance-audit.mjs   # Huron compliance & audit
    13-portfolio-analytics.mjs # Huron portfolio dashboard
    14-grant-dedup.mjs        # Huron deduplication
  docs/
    01-basic-vectors.md       # Detailed tutorial
    02-sql-queries.md
    03-sparql-triples.md
    04-cypher-graph.md
    05-grants-search.md
    06-gnn-inference.md
    07-graph-node.md
    08-edge-full.md
    09-ruvector-core.md
    10-grant-lifecycle.md
    11-grant-matching.md
    12-compliance-audit.md
    13-portfolio-analytics.md
    14-grant-dedup.md
```

## WASM Loading in Node.js

`@ruvector/rvlite` is compiled to WebAssembly and uses `fetch()` to load its `.wasm` binary. Since `fetch()` doesn't support `file://` URLs in Node.js, we provide a loader helper:

```javascript
// examples/lib/wasm-loader.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export async function initRvlite() {
  const mod = await import("@ruvector/rvlite");
  const init = mod.default;
  const modUrl = import.meta.resolve("@ruvector/rvlite");
  const modPath = fileURLToPath(modUrl);
  const wasmPath = join(dirname(modPath), "rvlite_bg.wasm");
  const wasmBytes = readFileSync(wasmPath);
  await init(wasmBytes);
  return mod;
}
```

**Usage in any example:**
```javascript
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();
```

In the browser, the standard import works without a loader:
```html
<script type="module">
  import init, { RvLite, RvLiteConfig } from '@ruvector/rvlite';
  await init();
  const db = new RvLite(new RvLiteConfig(128));
</script>
```

## API Quick Reference

### @ruvector/rvlite Core Methods

| Method | Description |
|--------|-------------|
| `new RvLiteConfig(dims)` | Create config with vector dimensions |
| `new RvLite(config)` | Create database instance |
| `db.insert(vector, metadata)` | Insert vector, returns auto-ID |
| `db.insert_with_id(id, vector, metadata)` | Insert with custom string ID |
| `db.search(vector, topK)` | Find nearest neighbors |
| `db.search_with_filter(vector, topK, filter)` | Filtered nearest neighbors |
| `db.get(id)` | Retrieve entry by ID |
| `db.delete(id)` | Remove entry |
| `db.len()` | Count of entries |
| `db.sql(query)` | Execute SQL vector query |
| `db.add_triple(s, p, o)` | Add RDF triple |
| `db.sparql(query)` | Execute SPARQL query |
| `db.cypher(query)` | Execute Cypher query |
| `db.cypher_stats()` | Graph statistics |
| `db.export_json()` | Export all data |
| `db.get_version()` | Version string |
| `db.get_features()` | Feature flags |

### Important Notes

- **Metadata** is returned as a `Map`, not a plain object. Use `Object.fromEntries(entry.metadata)` to convert.
- **Search results** use `score` (not `distance`) where higher = more similar for cosine.
- **SQL tables** must include a `VECTOR(N)` column. Column names cannot be SQL reserved words.
- **SQL queries** only support vector similarity: `SELECT * FROM t ORDER BY v <-> [query] LIMIT n`.
- **SPARQL** requires specific predicate IRIs (no wildcard `?p` patterns).
- **Cypher RETURN** supports single variable only (e.g., `RETURN g`, not `RETURN g, d`).
- **RvLiteConfig** is consumed by the constructor - do not access it after creating `RvLite`.

## Interactive Tools

```bash
# Start the built-in web dashboard
npm run dashboard

# Start an interactive REPL
npm run repl
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `fetch()` error on init | WASM loader uses browser fetch | Use `wasm-loader.mjs` helper for Node.js |
| `Cannot find module '...-win32-x64-msvc'` | Missing native binding | Platform-specific; use WASM alternatives |
| `Dimension mismatch` | Vector size != config dims | Ensure all vectors match `RvLiteConfig(N)` |
| `Table must have VECTOR column` | SQL table missing vector col | Add `v VECTOR(N)` to CREATE TABLE |
| `Not implemented` (SQL SELECT) | Non-vector SQL query | Use `ORDER BY v <-> [query]` pattern |
| `Complex property paths` (SPARQL) | Wildcard predicate `?p` | Use specific predicate IRIs |
| Metadata shows `{}` | Map serialization | Use `Object.fromEntries(entry.metadata)` |
| Process hangs after completion | Native bindings hold event loop | Use `process.exit(0)` or Ctrl+C |

## License

Part of the Huron Portland Hackathon project.
