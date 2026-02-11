# Slide 05: RuVector Deep Dive
**Duration**: 4 minutes | **ADR**: PRES-005

---

## RuVector Ecosystem

```
┌─────────────────────────────────────────────────────┐
│                RUVECTOR ECOSYSTEM                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  ruvector-    │  │   rvlite     │  │ ruvector-  │ │
│  │  postgres     │  │   (WASM)     │  │ attention  │ │
│  │              │  │              │  │            │ │
│  │  Server-side  │  │  Client-side │  │  Self-     │ │
│  │  pgvector +   │  │  offline     │  │  attention │ │
│  │  HNSW index   │  │  search      │  │  scoring   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│         └────────┬────────┴────────────────┘        │
│                  │                                   │
│         ┌────────▼────────┐                          │
│         │   ruvector-gnn   │                          │
│         │  Graph Neural    │                          │
│         │  Network for     │                          │
│         │  relationship    │                          │
│         │  discovery       │                          │
│         └─────────────────┘                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

| Component | Language | Use Case | Latency |
|-----------|----------|----------|---------|
| **ruvector-postgres** | SQL/Rust | Server-side similarity search via pgvector | <30ms |
| **rvlite** | Rust→WASM | Browser offline vector search | <80ms |
| **ruvector-attention** | Rust | Self-attention scoring for relevance | <10ms |
| **ruvector-gnn** | Rust | Graph relationships between entities | <50ms |

---

## How Vector Search Works

```
User Query: "NIH R01 grants for cancer research"
          │
          ▼
┌─────────────────────────┐
│  1. EMBED               │
│  Text → 384-dim vector  │
│  Model: MiniLM-L6-v2    │
│  [0.23, -0.15, 0.87...] │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. SEARCH              │
│  Cosine similarity      │
│  HNSW index (O(log n))  │
│  Threshold: < 0.3       │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. RANK                │
│  Attention re-scoring   │
│  GNN relationship boost │
│  Context-aware filter   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. RESULTS             │
│  Top-K proposals with   │
│  similarity scores      │
│  + Related entities     │
└─────────────────────────┘
```

---

## pgvector in PostgreSQL

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE proposals
  ADD COLUMN embedding vector(384);

-- Create HNSW index for fast search
CREATE INDEX ON proposals
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Similarity search
SELECT id, title,
  1 - (embedding <=> query_vec) AS similarity
FROM proposals
WHERE tenant_id = current_setting('app.tenant_id')
ORDER BY embedding <=> query_vec
LIMIT 10;
```

---

## WASM Offline Fallback (rvlite)

```typescript
// Client-side vector search when offline
import { VectorIndex } from '@/lib/wasm/vector-index';

const index = await VectorIndex.initialize({
  dimensions: 384,
  maxElements: 10000,
  distanceMetric: 'cosine'
});

// Add documents to local index
await index.add(docId, embedding);

// Search locally (no server needed)
const results = await index.search(queryEmbedding, {
  topK: 10,
  threshold: 0.3
});
```

---

### [ILLUSTRATION: Data flow diagram showing a search query entering from the left, passing through embedding (neural network icon), similarity search (database cylinder with distance lines), attention re-ranking (spotlight icon), and results display (card list). Pipeline style, left-to-right flow. Color gradient from input (blue) to output (green).]
