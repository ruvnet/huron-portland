# 03 - SPARQL & RDF Triple Store

Model grant relationships as RDF triples and query with SPARQL using `@ruvector/rvlite`.

## Run

```bash
cd ruvector
npm run sparql
```

## What This Example Does

1. Builds an RDF knowledge graph with 17 triples about Portland grants
2. Models grants, departments, sponsors, and their relationships
3. Queries the graph with 6 SPARQL queries

## Key Concepts

RDF (Resource Description Framework) stores data as **subject-predicate-object triples**. Each triple is a statement like "Grant G001 has title Water Infrastructure". SPARQL is the query language for RDF data.

### Supported SPARQL Operations

| Feature | Supported | Notes |
|---------|-----------|-------|
| `SELECT ?var WHERE { pattern }` | Yes | Core query pattern |
| Multiple triple patterns in WHERE | Yes | Joined with `.` |
| Specific predicate IRIs | Yes | `<http://example/hasTitle>` |
| Wildcard predicates `?p` | No | "Complex property paths not supported" |
| `FILTER` | Limited | Basic filters only |
| `OPTIONAL` | No | Not in WASM build |
| `ORDER BY` | No | Sort results in JavaScript |

## Step-by-Step Walkthrough

### 1. Define an IRI Namespace

```javascript
const EX = "http://portland.huron.example/";
```

RDF uses IRIs (Internationalized Resource Identifiers) to identify resources. Define a base namespace for your domain.

### 2. Add Triples

```javascript
// Subject: Grant G001
// Predicate: hasTitle
// Object: "Water Infrastructure Upgrade" (literal)
db.add_triple(
  `<${EX}grant/G001>`,
  `<${EX}hasTitle>`,
  `"Water Infrastructure Upgrade"`
);

// Object can also be another resource (IRI)
db.add_triple(
  `<${EX}grant/G001>`,
  `<${EX}hasDepartment>`,
  `<${EX}dept/PublicWorks>`
);
```

**Syntax rules:**
- IRIs: wrapped in angle brackets `<http://...>`
- String literals: wrapped in double quotes `"text"`
- All three arguments are strings in JavaScript

### 3. Build a Knowledge Graph

The example creates this graph:

```
Grant/G001 --hasTitle--> "Water Infrastructure Upgrade"
           --hasBudget--> "500000"
           --hasDepartment--> dept/PublicWorks
           --hasSponsor--> person/AliceJohnson

Grant/G002 --hasTitle--> "Youth STEM Initiative"
           --hasBudget--> "150000"
           --hasDepartment--> dept/Education
           --hasSponsor--> person/BobSmith

Grant/G003 --hasTitle--> "Affordable Housing Fund"
           --hasBudget--> "750000"
           --hasDepartment--> dept/Housing
           --hasSponsor--> person/AliceJohnson

dept/PublicWorks --deptName--> "Public Works"
dept/Education   --deptName--> "Education"
dept/Housing     --deptName--> "Housing & Development"

person/AliceJohnson --personName--> "Alice Johnson"
person/BobSmith     --personName--> "Bob Smith"
```

### 4. Query with SPARQL

**Find all grant titles:**
```javascript
const result = db.sparql(`
  SELECT ?grant ?title WHERE {
    ?grant <${EX}hasTitle> ?title
  }
`);
```

**Find grants by a specific sponsor:**
```javascript
const result = db.sparql(`
  SELECT ?grant ?title WHERE {
    ?grant <${EX}hasSponsor> <${EX}person/AliceJohnson> .
    ?grant <${EX}hasTitle> ?title
  }
`);
```

**Multi-pattern queries** join patterns with `.` (period):
```javascript
?grant <${EX}hasSponsor> <${EX}person/AliceJohnson> .
?grant <${EX}hasTitle> ?title
```
This finds grants where the sponsor is Alice AND retrieves their titles.

### 5. Parse Results

```javascript
// Result format:
{
  bindings: [
    {
      grant: { type: "uri", value: "http://portland.huron.example/grant/G001" },
      title: { type: "literal", value: "Water Infrastructure Upgrade" }
    },
    // ...
  ]
}

// Extract values:
for (const row of result.bindings) {
  console.log(row.title.value);  // "Water Infrastructure Upgrade"
}
```

Each binding variable returns `{ type, value }` where:
- `type: "uri"` for IRI resources
- `type: "literal"` for string values
- `value` is always a string

### 6. Count Triples

```javascript
console.log(db.triple_count());  // 17
```

## Expected Output

```
Loaded 17 triples.

--- All grant titles ---
  {"grant":"http://.../grant/G001","title":"Water Infrastructure Upgrade"}
  {"grant":"http://.../grant/G002","title":"Youth STEM Initiative"}
  {"grant":"http://.../grant/G003","title":"Affordable Housing Fund"}

--- Grants by Alice Johnson ---
  {"grant":"http://.../grant/G001","title":"Water Infrastructure Upgrade"}
  {"grant":"http://.../grant/G003","title":"Affordable Housing Fund"}

--- All departments ---
  {"dept":"http://.../dept/PublicWorks","name":"Public Works"}
  {"dept":"http://.../dept/Education","name":"Education"}
  {"dept":"http://.../dept/Housing","name":"Housing & Development"}

--- G002 title ---
  {"title":"Youth STEM Initiative"}

--- G002 budget ---
  {"budget":"150000"}

--- People ---
  {"person":"http://.../person/AliceJohnson","name":"Alice Johnson"}
  {"person":"http://.../person/BobSmith","name":"Bob Smith"}
```

## When to Use SPARQL vs SQL vs Cypher

| Feature | SPARQL (RDF) | SQL | Cypher |
|---------|-------------|-----|--------|
| Data model | Triples (S-P-O) | Tables + vectors | Property graph |
| Best for | Linked data, ontologies | Structured records | Relationships |
| Schema | Schema-free | Fixed columns | Labels + properties |
| Query joins | Triple patterns | Not supported | MATCH patterns |
| Standards | W3C standard | SQL subset | Neo4j-style |

## Common Pitfalls

1. **No wildcard predicates** - `?grant ?p ?o` fails. Always use specific predicate IRIs.
2. **IRI syntax** - Must wrap in angle brackets: `<http://example/pred>`, not `http://example/pred`.
3. **Literal syntax** - Must wrap in double quotes: `"text"`, not just `text`.
4. **Budget as string** - RDF literals are strings; parse numbers in JavaScript: `parseInt(row.budget.value)`.
5. **No OPTIONAL/UNION** - The WASM SPARQL engine has limited feature support.
