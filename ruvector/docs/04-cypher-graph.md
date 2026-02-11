# 04 - Cypher Property Graph

Build a Neo4j-style property graph with Cypher queries using `@ruvector/rvlite`.

## Run

```bash
cd ruvector
npm run cypher
```

## What This Example Does

1. Creates 12 labeled nodes (4 Departments, 3 Sponsors, 5 Grants)
2. Creates 14 relationships (SPONSORS, BELONGS_TO, PARTNERS_WITH)
3. Queries nodes and relationships with Cypher
4. Shows graph statistics

## Key Concepts

A property graph stores **labeled nodes** with properties and **typed relationships** between them. Cypher is the declarative query language for property graphs, made popular by Neo4j.

### Supported Cypher Operations

| Operation | Supported | Notes |
|-----------|-----------|-------|
| `CREATE (n:Label {props})` | Yes | Create nodes |
| `CREATE (a)-[:TYPE]->(b)` | Yes | Create relationships |
| `MATCH (n:Label) RETURN n` | Yes | Query nodes by label |
| `MATCH ()-[r:TYPE]->() RETURN r` | Yes | Query relationships |
| `MATCH ... RETURN a, b` | No | Single variable RETURN only |
| `WHERE` clauses | Limited | Basic property filters |
| `DELETE` / `SET` | No | Not in WASM build |

## Step-by-Step Walkthrough

### 1. Create Nodes with Labels and Properties

```javascript
db.cypher(`CREATE (pw:Department {name: 'Public Works', budget_cap: 2000000})`);
db.cypher(`CREATE (g1:Grant {title: 'Water Infrastructure', amount: 500000, status: 'approved'})`);
db.cypher(`CREATE (alice:Sponsor {name: 'Alice Johnson', role: 'Director'})`);
```

Each `CREATE` adds a node with:
- **Variable name** (e.g., `pw`) - used for referencing in relationships
- **Label** (e.g., `Department`) - categorizes the node type
- **Properties** - key-value pairs in `{}`

### 2. Create Relationships

```javascript
db.cypher(`CREATE (alice)-[:SPONSORS]->(g1)`);
db.cypher(`CREATE (g1)-[:BELONGS_TO]->(pw)`);
db.cypher(`CREATE (pw)-[:PARTNERS_WITH]->(env)`);
```

Relationships have:
- **Direction** - `(a)-[:TYPE]->(b)` (a points to b)
- **Type** - uppercase name like `SPONSORS`, `BELONGS_TO`
- Variables reference previously created nodes by their variable names

### 3. Check Graph Statistics

```javascript
const stats = db.cypher_stats();
console.log(stats.node_count);      // 12
console.log(stats.edge_count);      // 14
console.log(stats.label_count);     // 3 (Department, Grant, Sponsor)
console.log(stats.edge_type_count); // 3 (SPONSORS, BELONGS_TO, PARTNERS_WITH)
```

### 4. Query by Label

```javascript
const result = db.cypher("MATCH (g:Grant) RETURN g");
console.log(result.rows);   // Array of grant nodes
console.log(result.columns); // ["g"]
```

### 5. Query Relationships

```javascript
// Find all SPONSORS relationships
const sponsors = db.cypher(
  "MATCH (s:Sponsor)-[r:SPONSORS]->(g:Grant) RETURN r"
);

// Find all BELONGS_TO relationships
const belongs = db.cypher(
  "MATCH (g:Grant)-[r:BELONGS_TO]->(d:Department) RETURN r"
);
```

**Important:** Only single-variable RETURN is supported. `RETURN r` works, but `RETURN s, g` does not.

### 6. Error Handling

```javascript
function query(label, cypher) {
  try {
    const result = db.cypher(cypher);
    for (const row of result.rows || []) {
      console.log(JSON.stringify(row));
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
```

Wrap all Cypher calls in try/catch since some query patterns may not be supported.

## Graph Model

```
               SPONSORS
  Sponsor ─────────────────> Grant
  (Alice)                    (Water Infrastructure)
  (Bob)                      (STEM Program)
  (Carol)                    (Affordable Housing)
                             (River Cleanup)
                             (Road Repair)
                                  │
                                  │ BELONGS_TO
                                  ▼
                            Department
                            (Public Works)
                            (Education)
                            (Housing)
                            (Environment)
                                  │
                                  │ PARTNERS_WITH
                                  ▼
                            Department
```

## Expected Output

```
Graph stats:
  Nodes: 12
  Edges: 14
  Labels: 3
  Edge types: 3

--- All Grants ---
  Columns: [g]
  Rows: 5
  {...}

--- All Sponsors ---
  Columns: [s]
  Rows: 3

--- Sponsor -> Grant edges ---
  Rows: 5

--- Department partnerships ---
  Rows: 2

--- Final Graph Summary ---
{
  "node_count": 12,
  "edge_count": 14,
  "label_count": 3,
  "edge_type_count": 3
}
```

## Common Pitfalls

1. **Single RETURN variable** - `RETURN g, d` fails. Use `RETURN g` or `RETURN r` (one variable).
2. **Node variable scope** - Variables like `pw`, `alice` reference nodes within the same Cypher session/engine, not across separate `db.cypher()` calls.
3. **No DELETE/SET** - The WASM Cypher engine is read-heavy; use `cypher_clear()` to reset.
4. **Property access** - `RETURN g.title` may not populate. Return the full node and extract properties in JavaScript.
5. **Use try/catch** - Not all Cypher patterns are supported; wrap calls to handle gracefully.
