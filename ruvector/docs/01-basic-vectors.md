# 01 - Basic Vector Operations

Insert, search, filter, and manage vectors using `@ruvector/rvlite` WASM engine.

## Run

```bash
cd ruvector
npm run basic
```

## What This Example Does

1. Creates a 128-dimension vector database with cosine similarity
2. Inserts 8 document vectors with metadata (title, category)
3. Searches for the 3 nearest neighbors to a query vector
4. Performs filtered search (finance category only)
5. Retrieves a specific entry by ID
6. Deletes an entry
7. Inserts with a custom string ID

## Step-by-Step Walkthrough

### 1. Initialize WASM

```javascript
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();
```

The `wasm-loader.mjs` helper reads the `.wasm` binary from disk since Node.js doesn't support `fetch()` for local files. See the [main README](../README.md#wasm-loading-in-nodejs) for details.

### 2. Create a Database

```javascript
const config = new RvLiteConfig(128);  // 128 dimensions
const db = new RvLite(config);
// WARNING: do not use `config` after this line - Rust consumes it
```

`RvLiteConfig` accepts the number of dimensions. After passing it to `new RvLite()`, the config object is consumed by Rust's ownership model and becomes invalid.

### 3. Create Embeddings

```javascript
function embed(seed) {
  const vec = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    vec[i] = Math.sin(seed * (i + 1) * 0.1);
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  for (let i = 0; i < 128; i++) vec[i] /= norm;
  return vec;
}
```

In production, replace this with real embeddings from an ML model (e.g., `@ruvector/edge-full` ONNX embeddings or OpenAI/HuggingFace models). The key requirement: vectors must be `Float32Array` of exactly the configured dimensions, and should be L2-normalized for cosine similarity.

### 4. Insert Vectors with Metadata

```javascript
const id = db.insert(embed(1), {
  title: "Grant Application Guide",
  category: "docs",
});
```

- `insert(vector, metadata)` returns an auto-generated string ID
- Metadata is a plain JavaScript object with string values
- All metadata values are stored and returned as strings

### 5. Search by Similarity

```javascript
const results = db.search(embed(4), 3);  // top 3 nearest
for (const r of results) {
  console.log(r.id, r.score);
}
```

- `search(queryVector, topK)` returns an array of `{ id, score, metadata }`
- `score` is a similarity score (higher = more similar for cosine)
- Results are ordered by decreasing similarity

### 6. Handle Metadata (Map to Object)

```javascript
function meta(entry) {
  if (entry.metadata instanceof Map) return Object.fromEntries(entry.metadata);
  return entry.metadata || {};
}

const m = meta(results[0]);
console.log(m.title);  // "Infrastructure Repair Fund"
```

RvLite returns metadata as a JavaScript `Map`, not a plain object. `JSON.stringify(map)` produces `{}`, so always convert with `Object.fromEntries()`.

### 7. Filtered Search

```javascript
const filtered = db.search_with_filter(embed(2), 2, { category: "finance" });
```

- `search_with_filter(vector, topK, filterObj)` restricts results to entries whose metadata matches all filter key-value pairs
- Filter values must be exact string matches

### 8. Retrieve by ID

```javascript
const entry = db.get("some-id");
console.log(entry.id, meta(entry));
```

### 9. Delete

```javascript
db.delete("some-id");
console.log(db.len());  // count decreases by 1
```

### 10. Custom IDs

```javascript
db.insert_with_id("custom-001", embed(42), { title: "Custom Grant" });
const custom = db.get("custom-001");
```

Use `insert_with_id()` when you need deterministic, human-readable IDs.

## Expected Output

```
RvLite version: 0.2.4
Features: wasm
Inserted: Grant Application Guide  (id=...)
Inserted: Budget Template 2026  (id=...)
...
Total vectors: 8

--- Top 3 nearest to seed=4 (Infrastructure) ---
  Infrastructure Repair Fund  (score: 1.0000)
  Public Transit Expansion  (score: 0.9xxx)
  ...

--- Finance category only (top 2) ---
  Budget Template 2026  (score: 0.xxxx)
  Small Business Recovery Grant  (score: 0.xxxx)

--- Retrieved entry ---
  ID: ...
  Metadata: {"title":"Infrastructure Repair Fund","category":"infrastructure"}

After delete, total vectors: 7

--- Custom ID entry ---
  ID: custom-001
  Metadata: {"title":"Custom Grant","category":"special"}
```

## API Reference

| Method | Signature | Returns |
|--------|-----------|---------|
| `insert` | `(vector: Float32Array, metadata: object)` | `string` (auto ID) |
| `insert_with_id` | `(id: string, vector: Float32Array, metadata: object)` | `void` |
| `search` | `(vector: Float32Array, topK: number)` | `Array<{id, score, metadata}>` |
| `search_with_filter` | `(vector: Float32Array, topK: number, filter: object)` | `Array<{id, score, metadata}>` |
| `get` | `(id: string)` | `{id, metadata}` |
| `delete` | `(id: string)` | `void` |
| `len` | `()` | `number` |
| `get_version` | `()` | `string` |
| `get_features` | `()` | `string` |

## Common Pitfalls

1. **Config consumed after construction** - Never access `RvLiteConfig` after `new RvLite(config)`
2. **Metadata is a Map** - Always convert with `Object.fromEntries()` before accessing `.title` etc.
3. **Dimension mismatch** - All vectors must match the dimensions in `RvLiteConfig(N)`
4. **Score vs distance** - Results use `score` (higher = more similar), not `distance`
