# 02 - SQL Vector Search

Use SQL syntax for vector similarity search with `@ruvector/rvlite`.

## Run

```bash
cd ruvector
npm run sql
```

## What This Example Does

1. Creates a SQL table with a `VECTOR(4)` column and text/numeric columns
2. Inserts 5 grant proposal rows
3. Performs 3 vector similarity searches with different query vectors

## Key Concepts

RvLite's SQL engine is **vector-first**. Every table must have at least one `VECTOR(N)` column, and the primary query pattern is similarity search using the `<->` distance operator.

### Supported SQL Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| `CREATE TABLE` | Yes | Must include `VECTOR(N)` column |
| `INSERT INTO` | Yes | Vectors use `[0.1, 0.2, ...]` format (no quotes) |
| `SELECT * ... ORDER BY v <-> [query] LIMIT n` | Yes | Main query pattern |
| `SELECT col FROM table` (no vector) | No | "Not implemented" |
| `PRIMARY KEY` constraint | No | Omit from CREATE TABLE |
| `WHERE` clause | No | Use `search_with_filter()` instead |

## Step-by-Step Walkthrough

### 1. Create a Table

```javascript
const DIMS = 4;
const db = new RvLite(new RvLiteConfig(DIMS));

db.sql(`CREATE TABLE grants (
  v VECTOR(${DIMS}),
  gid TEXT,
  gtitle TEXT,
  gamount REAL,
  gstatus TEXT
)`);
```

**Rules:**
- Must include at least one `VECTOR(N)` column
- Column names **cannot be SQL reserved words** (`id`, `title`, `status`, `amount`, `vector`, `text`, `value`, etc.)
- Prefix columns to avoid conflicts: `gid`, `gtitle`, `gamount`, `gstatus`
- No `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, or other constraints

### 2. Insert Rows

```javascript
db.sql(
  `INSERT INTO grants (v, gid, gtitle, gamount, gstatus) VALUES (` +
  `[0.9, 0.1, 0.2, 0.3], 'G-001', 'Water Infrastructure', 500000, 'pending')`
);
```

**Rules:**
- Vector values use `[0.9, 0.1, 0.2, 0.3]` format (no quotes around the array)
- String values use single quotes: `'Water Infrastructure'`
- Numeric values are unquoted: `500000`

### 3. Vector Similarity Search

```javascript
const results = db.sql(
  "SELECT * FROM grants ORDER BY v <-> [0.85, 0.15, 0.25, 0.35] LIMIT 3"
);
```

The `<->` operator computes distance between the `v` column and the query vector. Results include a special `_distance` column with the computed distance.

### 4. Parse Typed Results

```javascript
function val(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.Text || v.Real || v.Integer || JSON.stringify(v);
  return v;
}

for (const row of results.rows) {
  console.log(val(row.gtitle));   // "Water Infrastructure"
  console.log(val(row.gamount));  // 500000
  console.log(val(row._distance)); // 0.0234...
}
```

SQL results return **typed values**:
- Text columns: `{ Text: "Water Infrastructure" }`
- Numeric columns: `{ Real: 500000 }` or `{ Integer: 42 }`
- The `_distance` column contains the similarity distance

Use the `val()` helper to extract the actual value.

## Result Format

```javascript
{
  columns: ["v", "gid", "gtitle", "gamount", "gstatus", "_distance"],
  rows: [
    {
      v: [...],
      gid: { Text: "G-001" },
      gtitle: { Text: "Water Infrastructure" },
      gamount: { Real: 500000 },
      gstatus: { Text: "pending" },
      _distance: 0.0234
    },
    // ...
  ]
}
```

## Expected Output

```
Table 'grants' created.

Inserted 5 grants.

--- Nearest to [0.85, 0.15, 0.25, 0.35] (infrastructure-like) ---
  G-001 | Water Infrastructure      |   $500,000 | pending  | dist: 0.0069
  G-004 | Road Repair Phase II      |   $300,000 | approved | dist: 0.0182
  G-003 | Affordable Housing        |   $750,000 | pending  | dist: 0.7191

--- Nearest to [0.1, 0.85, 0.15, 0.15] (education-like) ---
  G-002 | Youth STEM Program        | dist: 0.0069
  G-005 | Community College Fund    | dist: 0.0182
  G-001 | Water Infrastructure      | dist: 0.8925

--- Nearest to [0.2, 0.1, 0.85, 0.3] (housing-like) ---
  G-003 | Affordable Housing        | dist: 0.0000
  G-004 | Road Repair Phase II      | dist: 0.5252
  G-001 | Water Infrastructure      | dist: 0.7191
```

## Common Pitfalls

1. **No regular SELECT** - `SELECT gtitle FROM grants` fails with "Not implemented". Only vector search queries work.
2. **Reserved column names** - `id`, `title`, `amount`, `status` cause parse errors. Prefix them.
3. **Vector format** - Use `[0.1,0.2]` not `'[0.1,0.2]'` (no quotes around array).
4. **No WHERE clause** - Use `search_with_filter()` from the core API instead.
5. **No PRIMARY KEY** - The SQL parser doesn't support constraints.
6. **VECTOR column required** - Tables without a VECTOR column will fail.
