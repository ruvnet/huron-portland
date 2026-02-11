# PRES-005: RuVector Deep Dive

## Status
Accepted

## Context
RuVector is a multi-component ecosystem that needs careful explanation. Attendees need to understand: ruvector-postgres (server-side), rvlite (client-side WASM), ruvector-attention (relevance scoring), and ruvector-gnn (graph relationships).

## Decision
- Present the ecosystem as a connected diagram showing all 4 components
- Walk through the 4-step search pipeline: Embed → Search → Rank → Results
- Show concrete SQL for pgvector operations
- Show TypeScript for rvlite WASM usage
- Include latency targets for each component

## Consequences
- Deep understanding of vector search mechanics
- SQL examples make pgvector approachable for database-familiar attendees
- TypeScript examples make WASM accessible for frontend developers

## Duration
4 minutes

## Key Message
4 components, one pipeline: embed, search, rank, results -- with offline WASM fallback.
