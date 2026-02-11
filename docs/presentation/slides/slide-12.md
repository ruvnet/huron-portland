# Slide 12: Modern Frontend: Next.js 14 + WASM
**Duration**: 4 minutes | **ADR**: PRES-012

---

## Frontend Stack

```
┌──────────────────────────────────────────────────┐
│            FRONTEND ARCHITECTURE                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Framework:  Next.js 14 (App Router)             │
│  Language:   TypeScript                          │
│  Styling:    Tailwind CSS + shadcn/ui            │
│  State:      TanStack Query (server state)       │
│  Testing:    Playwright (E2E)                    │
│  Special:    WASM vector search (rvlite)         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## App Router Structure

```
src/frontend/app/
├── layout.tsx          # Root layout (providers, nav)
├── page.tsx            # Home / landing
├── dashboard/
│   ├── page.tsx        # Dashboard overview
│   └── layout.tsx      # Dashboard shell
├── proposals/
│   ├── page.tsx        # Proposal list
│   ├── [id]/
│   │   └── page.tsx    # Proposal detail
│   └── new/
│       └── page.tsx    # Create proposal
├── search/
│   └── page.tsx        # Vector search page
└── api/
    └── ...             # API routes (BFF)
```

---

## Component Architecture

```
┌─────────────────────────────────────────┐
│            PAGE COMPONENTS              │
│  (App Router server components)         │
│  - Data fetching at the page level      │
│  - SEO metadata                         │
├─────────────────────────────────────────┤
│         DOMAIN COMPONENTS               │
│  (proposals/, budgets/, awards/)        │
│  - ProposalCard                         │
│  - ProposalSearch (with WASM)           │
│  - BudgetTable                          │
│  - StatusBadge                          │
├─────────────────────────────────────────┤
│           UI PRIMITIVES                 │
│  (shadcn/ui base components)            │
│  - Button, Input, Card                  │
│  - Dialog, Table, Badge                 │
│  - Toast, Skeleton, Tooltip             │
└─────────────────────────────────────────┘
```

---

## WASM Vector Search (rvlite)

```typescript
// lib/wasm/vector-index.ts
import init, { WasmVectorIndex } from 'rvlite';

export class VectorSearchEngine {
  private index: WasmVectorIndex | null = null;

  async initialize() {
    await init(); // Load WASM module
    this.index = new WasmVectorIndex({
      dimensions: 384,
      distanceMetric: 'cosine',
      maxElements: 10000,
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    // 1. Get embedding from RuVector API (or cache)
    const embedding = await this.getEmbedding(query);

    // 2. Search locally via WASM (< 80ms)
    const results = this.index.search(embedding, {
      topK: 10,
      threshold: 0.3,
    });

    return results;
  }
}
```

---

## Online + Offline Strategy

```
┌──────────────────────────────────────────────┐
│  User types search query                     │
│           │                                  │
│     ┌─────▼─────┐                            │
│     │  Online?  │                            │
│     └──┬─────┬──┘                            │
│        │     │                               │
│    Yes │     │ No                             │
│        ▼     ▼                               │
│   ┌────────┐ ┌────────┐                      │
│   │pgvector│ │rvlite  │                      │
│   │Server  │ │WASM    │                      │
│   │<30ms   │ │<80ms   │                      │
│   └───┬────┘ └───┬────┘                      │
│       │          │                           │
│       └────┬─────┘                           │
│            ▼                                 │
│     ┌────────────┐                           │
│     │  Render    │                           │
│     │  Results   │                           │
│     └────────────┘                           │
└──────────────────────────────────────────────┘
```

---

### [ILLUSTRATION: Browser window mockup showing a Next.js application with a sidebar navigation, search bar with auto-complete, and proposal cards in a grid layout. One card is expanded showing vector similarity scores. Bottom-left corner shows a "WASM" badge indicating offline capability. Modern flat UI design, dark mode theme.]
