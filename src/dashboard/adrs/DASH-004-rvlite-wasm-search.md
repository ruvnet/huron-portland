# DASH-004: rvlite WASM Vector Search

## Status
Accepted

## Context
The dashboard needs to demonstrate semantic vector search capability. The production system uses pgvector on the backend, but the dashboard should also work offline for demos.

## Decision
Implement a dual-layer vector search:
1. **Primary**: `@ruvector/rvlite` WASM module for client-side 384-dim vector search
2. **Fallback**: Pure JavaScript cosine similarity when WASM is unavailable

The loader (`rvlite-loader.ts`) attempts to load the WASM module and falls back gracefully:
```
try WASM → catch → JS fallback
```

## Embedding Strategy (Demo Mode)
For hackathon demos, use a deterministic hash-based embedding:
- Text normalized and tokenized
- Character codes mapped to 384-dim vector positions
- L2-normalized for cosine similarity compatibility

In production, this would be replaced by sentence-transformer embeddings.

## Consequences
- **Positive**: Works fully offline with no backend dependency
- **Positive**: Demonstrates WASM capability even without rvlite package installed
- **Negative**: Demo embeddings are not semantically meaningful
- **Mitigated**: Sufficient for showing the search UX flow and architecture pattern
