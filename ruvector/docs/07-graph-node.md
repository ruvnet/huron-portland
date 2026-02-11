# 07 - Native Graph Database

High-performance native graph database with Cypher queries, hypergraph support, and persistence using `@ruvector/graph-node`.

## Run

```bash
cd ruvector
npm run graph-node
```

## Prerequisites

Requires **native NAPI-RS bindings**. Supported platforms:
- Linux x64 / arm64
- macOS x64 / arm64
- Windows x64

## What This Example Does

1. Creates a native graph database with 128-dimensional embeddings
2. Adds 6 nodes (departments and grants) with properties and embeddings
3. Creates 4 directed edges with labels
4. Creates a hyperedge connecting multiple nodes
5. Queries with Cypher
6. Shows database statistics

## Key Differences from RvLite Cypher (Example 04)

| Feature | @ruvector/rvlite (04) | @ruvector/graph-node (07) |
|---------|----------------------|--------------------------|
| Engine | WASM | Native (NAPI-RS) |
| Speed | Baseline | 10x faster |
| API | Synchronous | **All async (await)** |
| Properties | Any JS type | **Strings only** |
| Embeddings | Not supported | Per-node/edge Float32Array |
| Hyperedges | No | Yes |
| Persistence | In-memory | File-backed |
| Edge fields | Implicit | `from`, `to`, `label`, `description`, `embedding` |

## Step-by-Step Walkthrough

### 1. Import (with Fallback)

```javascript
let GraphDatabase;
try {
  const mod = await import("@ruvector/graph-node");
  GraphDatabase = mod.GraphDatabase || mod.default;
} catch (e) {
  console.error("@ruvector/graph-node requires native bindings.");
  process.exit(1);
}
```

### 2. Create Database

```javascript
const db = new GraphDatabase({
  dimensions: 128,
  distanceMetric: "Cosine",
});
```

Options:
- `dimensions` - Vector embedding dimensions
- `distanceMetric` - `"Cosine"`, `"Euclidean"`, or `"DotProduct"`

### 3. Create Nodes

```javascript
const embed = (dim) => new Float32Array(dim).map(() => Math.random());

const id = await db.createNode({
  id: "dept-pw",
  label: "Department",
  properties: { name: "Public Works", budget: "5000000" },
  embedding: embed(128),
});
```

**Important rules:**
- All operations are **async** (use `await`)
- Property values must be **strings** (not numbers)
- `embedding` is a `Float32Array` matching the configured dimensions

### 4. Create Edges

```javascript
await db.createEdge({
  from: "grant-1",         // source node ID
  to: "dept-pw",           // target node ID
  label: "BELONGS_TO",     // relationship type
  properties: {},          // edge properties (strings)
  description: "BELONGS_TO",  // required text description
  embedding: embed(128),   // required embedding vector
});
```

**Edge field names:**
- `from` and `to` (not `source`/`target`)
- `description` is required (can match label)
- `embedding` is required

### 5. Create Hyperedges

```javascript
const hid = await db.createHyperedge({
  label: "JOINT_INITIATIVE",
  nodes: ["dept-pw", "dept-env"],    // connects multiple nodes
  properties: { name: "Green Infrastructure Plan" },
  description: "Cross-department green initiative",
  embedding: embed(128),
  confidence: 0.92,                   // optional confidence score
});
```

Hyperedges connect **multiple nodes** simultaneously, representing N-ary relationships that can't be expressed as simple directed edges.

### 6. Cypher Queries

```javascript
const grants = await db.query("MATCH (g:Grant) RETURN g");
console.log(JSON.stringify(grants, null, 2));
```

Note: Use `db.query()` (not `db.cypher()`) for Cypher queries.

### 7. Database Statistics

```javascript
const stats = await db.stats();
// {
//   "totalNodes": 6,
//   "totalEdges": 5,
//   "avgDegree": 1.666...
// }
```

## Expected Output

```
=== Native Graph Database ===

Created node: dept-pw (Department)
Created node: dept-ed (Department)
Created node: dept-env (Department)
Created node: grant-1 (Grant)
Created node: grant-2 (Grant)
Created node: grant-3 (Grant)
Created edge: grant-1 -[BELONGS_TO]-> dept-pw
Created edge: grant-2 -[BELONGS_TO]-> dept-ed
Created edge: grant-3 -[BELONGS_TO]-> dept-env
Created edge: dept-pw -[PARTNERS_WITH]-> dept-env

=== Cypher Queries ===

Grants: [...]

=== Hyperedge ===

Hyperedge created: ...

=== Database Stats ===
{
  "totalNodes": 6,
  "totalEdges": 5,
  "avgDegree": 1.6667
}

Done.
```

## API Reference

### GraphDatabase

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `({dimensions, distanceMetric})` | instance | Create DB |
| `createNode` | `({id, label, properties, embedding})` | `Promise<string>` | Add node |
| `createEdge` | `({from, to, label, properties, description, embedding})` | `Promise<string>` | Add edge |
| `createHyperedge` | `({label, nodes, properties, description, embedding, confidence})` | `Promise<string>` | Add hyperedge |
| `query` | `(cypherString)` | `Promise<object>` | Cypher query |
| `stats` | `()` | `Promise<object>` | DB statistics |

## Common Pitfalls

1. **All async** - Every operation returns a Promise. Always use `await`.
2. **String properties only** - `budget: 5000000` fails. Use `budget: "5000000"`.
3. **Edge fields** - Must use `from`/`to`, not `source`/`target`. Must include `description` and `embedding`.
4. **Embedding required** - Both nodes and edges need Float32Array embeddings.
5. **Process may hang** - Native bindings can hold the event loop open. Use `process.exit(0)` if needed.
