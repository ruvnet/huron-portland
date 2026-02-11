# 05 - Grants Semantic Search

Full-featured semantic search over Portland grant proposals with text embeddings and metadata filtering.

## Run

```bash
cd ruvector
npm run grants
```

## What This Example Does

1. Creates a 256-dimension vector database
2. Indexes 10 Portland grant proposals with text embeddings
3. Runs 6 semantic search queries
4. Demonstrates filtered search by department

## Key Concepts

Semantic search finds documents by **meaning** rather than exact keyword match. Each proposal is converted to a vector embedding that captures its semantic content, and similarity search finds the closest matches.

## Step-by-Step Walkthrough

### 1. Text Embedding Function

```javascript
const DIMS = 256;

function textEmbed(text) {
  const vec = new Float32Array(DIMS);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let c = 0; c < word.length; c++) {
      const h1 = (word.charCodeAt(c) * 31 + w * 7 + c * 13) % DIMS;
      const h2 = (word.charCodeAt(c) * 37 + w * 11 + c * 17) % DIMS;
      vec[h1] += 1.0 / words.length;
      vec[h2] += 0.5 / words.length;
    }
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) for (let i = 0; i < DIMS; i++) vec[i] /= norm;
  return vec;
}
```

This is a **hash-based embedding** for demonstration. It maps characters and word positions to vector dimensions deterministically. Similar texts produce similar vectors because they share character patterns.

In production, use a real embedding model:
- `@ruvector/edge-full` ONNX embedder (browser)
- OpenAI `text-embedding-3-small`
- HuggingFace `all-MiniLM-L6-v2`

### 2. Dataset: Portland Grant Proposals

The example indexes 10 real-world-style proposals:

| Title | Department | Amount |
|-------|-----------|--------|
| Willamette River Water Quality Monitoring | Environment | $320,000 |
| Portland Youth STEM Academy | Education | $180,000 |
| Burnside Bridge Seismic Retrofit | Public Works | $2,500,000 |
| Affordable Housing Trust Fund | Housing | $1,200,000 |
| Community Solar Garden Initiative | Environment | $450,000 |
| Small Business Recovery Program | Economic Dev | $600,000 |
| Public Transit Signal Priority | Transportation | $380,000 |
| Urban Tree Canopy Expansion | Parks | $250,000 |
| Mental Health First Responder Program | Health | $520,000 |
| Digital Equity Internet Access | Technology | $350,000 |

### 3. Index Proposals

```javascript
for (const p of proposals) {
  const text = `${p.title} ${p.description} ${p.tags.join(" ")} ${p.department}`;
  db.insert(textEmbed(text), {
    title: p.title,
    department: p.department,
    amount: String(p.amount),  // metadata values must be strings
  });
}
```

The embedding combines title, description, tags, and department into a single text for maximum semantic coverage.

### 4. Semantic Search

```javascript
const queries = [
  "water quality river environmental monitoring",
  "affordable housing construction low income",
  "youth education technology stem",
  "infrastructure bridge road repair",
  "clean energy solar renewable",
  "mental health crisis response",
];

for (const q of queries) {
  const results = db.search(textEmbed(q), 3);
  // results[0] is the best match
}
```

Each query finds the 3 most semantically similar proposals. The hash-based embedding captures word overlap, so queries about "water quality" match the Water Quality Monitoring proposal.

### 5. Filtered Search

```javascript
const envResults = db.search_with_filter(
  textEmbed("climate sustainability green"),
  3,
  { department: "Environment" }
);
```

Filter restricts results to only Environment department proposals. The filter is applied **before** ranking, so you get the top matches within that department.

## Expected Output

```
Indexing proposals...

Indexed 10 proposals.

Query: "water quality river environmental monitoring"
------------------------------------------------------------
  1. Willamette River Water Quality Monitoring
     Dept: Environment | $320,000
     Score: 0.8234
  2. Community Solar Garden Initiative
     Dept: Environment | $450,000
     Score: 0.3421
  3. Urban Tree Canopy Expansion
     Dept: Parks | $250,000
     Score: 0.2987

Query: "affordable housing construction low income"
------------------------------------------------------------
  1. Affordable Housing Trust Fund
     Dept: Housing | $1,200,000
     Score: 0.7891
  ...

=== Environment Department Only ===
  - Willamette River Water Quality Monitoring (score: 0.xxxx)
  - Community Solar Garden Initiative (score: 0.xxxx)
```

## Production Tips

1. **Use real embeddings** - Replace `textEmbed()` with an ML model for production-quality results
2. **Normalize vectors** - Always L2-normalize for cosine similarity
3. **Combine text fields** - Concatenate title + description + tags for richer embeddings
4. **Metadata as strings** - All metadata values are stored as strings; convert numbers with `String()`
5. **Filter strategically** - Use `search_with_filter()` when you know the exact department/category
6. **Tune topK** - Start with 5-10 results and let users drill down
