# Agentic Engineering: Building AI-Native Apps in Under 2 Hours
## Bangalore Hackathon Presentation

**Your Host**: rUv
**Duration**: ~60 minutes (15 slides x ~4 min each)
**Format**: Workshop + Live Build

---

> **How to use this document**: Each section is one slide. Present top-to-bottom.
> Code blocks are meant to be shown/demonstrated live.
> ASCII diagrams replace visual slides.
> [ILLUSTRATION] tags describe images to create separately.

---

## Slide Outline

| # | Slide | Min | Focus |
|---|-------|-----|-------|
| 01 | Welcome & What We're Building | 4 | Intro rUv, reveal the grants system |
| 02 | The Grants Management System | 4 | HCG domain, demo the end product |
| 03 | What is Agentic Engineering | 4 | Paradigm shift, swarm model |
| 04 | The Toolchain: Claude Code + Claude Flow + RuVector | 4 | Stack overview, roles |
| 05 | Setup: Codespace + Installation | 4 | Get everyone running |
| 06 | ADRs & DDD: Guardrails for Agents | 4 | Anti-drift architecture |
| 07 | Repository Structure & Clean Architecture | 4 | Code layout, 4 layers |
| 08 | Database, Auth & Multi-Tenancy (RLS) | 4 | PostgreSQL + pgvector + RLS |
| 09 | RuVector Deep Dive | 4 | Postgres, rvlite, Attention, GNN |
| 10 | Backend: Go Domain + API | 4 | Handlers, middleware, state machine |
| 11 | Frontend: Next.js Dashboard + WASM | 4 | Dashboard, offline search |
| 12 | Self-Learning & Self-Optimizing | 4 | SONA engine, swarm optimization |
| 13 | Live Build: Prototype in Under 2 Hours | 4 | 5-phase plan, swarm prompts |
| 14 | Testing, Validation & Demo | 4 | Playwright, checklists, run it |
| 15 | Wrap-Up: Your Agentic Future | 4 | Takeaways, next steps, resources |

---
---

# Slide 01: Welcome & What We're Building
**Duration**: 4 minutes | **ADR**: PRES-001

---

## Title Card

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   AGENTIC ENGINEERING                             ║
║   Building AI-Native Apps in Under 2 Hours        ║
║                                                   ║
║   Bangalore Hackathon                             ║
║   Your Host: rUv                                  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## About rUv

- Creator of **Claude Flow** (multi-agent swarm orchestration)
- Creator of **RuVector** (self-learning vector search ecosystem)
- Building at the intersection of AI agents + software architecture
- Today: teaching you to build production systems with AI swarms

---

## What We're Building Today

> **Huron Grants Consulting (HCG)** -- a fully functional
> AI-powered grants management system with:
>
> - Semantic search across thousands of proposals
> - Multi-tenant data isolation (university-grade security)
> - 21-state proposal lifecycle workflow
> - Self-learning search that improves with every query
> - Offline-capable WASM vector search
> - Modern dashboard with real-time status pipeline
>
> **Built from scratch. In under 2 hours. Using AI agent swarms.**

---

## The Stack at a Glance

```
┌──────────────────────────────────────────────────┐
│  Frontend    Next.js 14 + WASM (rvlite)          │
│  Backend     Go Clean Architecture + DDD         │
│  Database    PostgreSQL + pgvector + RLS          │
│  AI/Search   RuVector (embeddings + self-learn)  │
│  Orchestr.   Claude Flow V3 (agent swarms)       │
│  Dev Tool    Claude Code (AI-powered CLI)         │
└──────────────────────────────────────────────────┘
```

---

### [ILLUSTRATION: Hero split -- left side shows the final HCG dashboard (dark mode, stat cards, pipeline, search bar). Right side shows rUv with a swarm of AI agents radiating outward. Bangalore skyline in background. Color: deep blue, electric purple, white.]

---
---

# Slide 02: The Grants Management System
**Duration**: 4 minutes | **ADR**: PRES-002

---

## Why Grants Management?

```
Problem:
  Universities manage 1000s of grant proposals
  across dozens of funding agencies (NIH, NSF, DOD...)
  with complex compliance, budgets, and deadlines.

  Traditional tools: spreadsheets, email threads, manual tracking.

Solution:
  AI-powered system that:
  - Searches proposals by meaning, not just keywords
  - Enforces workflow rules automatically
  - Isolates each university's data completely
  - Learns from user behavior to improve results
```

---

## The HCG Domain

```
┌─────────────────────────────────────────────────────────┐
│              GRANTS MANAGEMENT LIFECYCLE                 │
│                                                         │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐             │
│  │  DRAFT  │──→│ SUBMITTED│──→│  UNDER   │             │
│  │         │   │          │   │  REVIEW  │             │
│  └─────────┘   └──────────┘   └────┬─────┘             │
│                                     │                   │
│                          ┌──────────┼──────────┐        │
│                          ▼          ▼          ▼        │
│                    ┌──────────┐ ┌────────┐ ┌────────┐   │
│                    │ APPROVED │ │REJECTED│ │REVISION│   │
│                    └────┬─────┘ └────────┘ └───┬────┘   │
│                         │                      │        │
│                         ▼                      │        │
│                    ┌──────────┐                 │        │
│                    │  ACTIVE  │←────────────────┘        │
│                    │  (Award) │                          │
│                    └────┬─────┘                          │
│                         ▼                               │
│                    ┌──────────┐                          │
│                    │  CLOSED  │                          │
│                    └──────────┘                          │
│                                                         │
│  21 states | 26 actions | per-tenant configuration      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7 Bounded Contexts (DDD)

| Context | Responsibility | Key Entity |
|---------|---------------|------------|
| **Proposal Management** | Lifecycle from draft to submission | Proposal |
| **Budget Management** | Line items, F&A rates, variance | Budget |
| **Award Management** | Funded grants, modifications | Award |
| **SF424 Forms** | Federal form generation | FormPackage |
| **Compliance** | IRB/IACUC protocols | ComplianceItem |
| **Financial Accounts** | Integration with finance systems | Account |
| **Identity** (shared) | People and organizations | Person |

---

## Dashboard Preview

```
┌─────────────────────────────────────────────────────────┐
│  HCG Grants Dashboard                        [User]    │
├──────────┬──────────────────────────────────────────────┤
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ SIDEBAR  │  │ Active   │ │ Pending  │ │ Total    │     │
│          │  │ Grants   │ │ Reviews  │ │ Budget   │     │
│Dashboard │  │   12     │ │    5     │ │  $2.4M   │     │
│Proposals │  └──────────┘ └──────────┘ └──────────┘     │
│Budgets   │                                              │
│Awards    │  ┌──────────────────────────────────────┐    │
│Search    │  │ Draft(8) → Review(5) → Approved(12)  │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  [ Search proposals by meaning... ]          │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

### [ILLUSTRATION: Full-page HCG system diagram. Center: the proposal lifecycle as a flowchart. Surrounding it: 7 bounded context badges connected by domain event arrows. Bottom: a dashboard mockup screenshot. Clean enterprise SaaS aesthetic.]

---
---

# Slide 03: What is Agentic Engineering
**Duration**: 4 minutes | **ADR**: PRES-003

---

## The Paradigm Shift

| Traditional Development | Agentic Engineering |
|------------------------|-------------------|
| Developer writes all code | AI agents write code, human steers |
| Sequential workflow | Parallel swarm execution |
| Manual testing | Self-validating pipelines |
| Static architecture | Self-learning, self-optimizing |
| Hours to prototype | Minutes to prototype |

---

## How It Works

```
Old World:           New World:

Human → Code         Human → Intent
                        │
                        ▼
                     Agent Swarm (6 agents in parallel)
                        │
                     ┌───┼───┬───┬───┬───┐
                     ▼   ▼   ▼   ▼   ▼   ▼
                     R   A   B   F   T   V
                     │   │   │   │   │   │
                     └───┴───┴───┴───┴───┘
                        │
                        ▼
                     Working System
                     (tested, reviewed, documented)

R=Researcher  A=Architect  B=Backend
F=Frontend    T=Tester     V=Reviewer
```

---

## 5 Principles

1. **Intent over Implementation** -- describe WHAT, agents figure out HOW
2. **Swarm Parallelism** -- 6 agents working simultaneously
3. **Architectural Guardrails** -- ADRs + DDD prevent agent drift
4. **Memory & Learning** -- agents remember patterns, improve over time
5. **Human-in-the-Loop** -- you steer, agents execute

---

### [ILLUSTRATION: Left side: single developer at keyboard (old way). Right side: developer with 6 agent nodes radiating outward, each labeled with a role, all connected by glowing lines. Arrow showing 10x output difference. Flat modern design.]

---
---

# Slide 04: The Toolchain
**Duration**: 4 minutes | **ADR**: PRES-004

---

## Three Tools, One Workflow

```
┌─────────────────────────────────────────────────┐
│              YOUR AGENTIC TOOLCHAIN             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐   ┌──────────────────────┐   │
│  │  Claude Code  │   │    Claude Flow V3     │   │
│  │  (AI CLI)     │   │  (Swarm Orchestrator) │   │
│  └──────┬───────┘   └──────────┬───────────┘   │
│         │                      │                │
│         ▼                      ▼                │
│  ┌──────────────────────────────────────────┐   │
│  │          RuVector Ecosystem               │   │
│  │  ┌─────────┐ ┌────────┐ ┌─────────────┐ │   │
│  │  │ruvector  │ │rvlite  │ │ attention/  │ │   │
│  │  │postgres  │ │(WASM)  │ │ GNN engine  │ │   │
│  │  └─────────┘ └────────┘ └─────────────┘ │   │
│  └──────────────────────────────────────────┘   │
│                      │                          │
│                      ▼                          │
│  ┌──────────────────────────────────────────┐   │
│  │     PostgreSQL + pgvector + RLS           │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Tool Roles

| Tool | What It Does | In Our Project |
|------|-------------|---------------|
| **Claude Code** | AI-powered CLI that reads your codebase and writes production code | Write Go handlers, React components, tests |
| **Claude Flow** | Coordinates multiple AI agents in parallel with shared memory | 6-agent swarms building features simultaneously |
| **RuVector** | Semantic search, embeddings, self-learning vector engine | Proposal search, offline WASM, relevance ranking |

---

## The CLAUDE.md File

```markdown
# CLAUDE.md -- Your AI's instruction manual
## Project Structure   → what goes where
## Coding Standards    → how to write code
## Swarm Patterns      → how to coordinate agents
## Domain Context      → what the grants system does
## File Organization   → never save to root folder
```

> This file is the single most important artifact
> for controlling AI agent behavior.
> Agents read it first, every time.

---

### [ILLUSTRATION: Layered pyramid. Top: Claude Code (blue). Middle: Claude Flow with 6 agent icons. Bottom: RuVector components spread across the base. PostgreSQL cylinder at the very bottom. Arrows flowing downward. Clean flat design.]

---
---

# Slide 05: Setup - Codespace + Installation
**Duration**: 4 minutes | **ADR**: PRES-005

---

## Option A: GitHub Codespace (Recommended)

```bash
# 60-second start -- everything pre-installed
gh codespace create --repo ruvnet/huron-bangalore

# Or: github.com/ruvnet/huron-bangalore → Code → Codespaces → Create

# Then run:
./scripts/setup.sh
./scripts/validate.sh
```

---

## Option B: Local Setup

```bash
# Clone
git clone https://github.com/ruvnet/huron-bangalore.git
cd huron-bangalore

# Prerequisites: Node 20+, Go 1.21+, Docker 24+

# Install tools
npm install -g @anthropic-ai/claude-code
npm install -g @claude-flow/cli@latest

# Environment
cp .env.example .env
export ANTHROPIC_API_KEY="sk-ant-..."

# Launch
./scripts/setup.sh
```

---

## Decision Matrix

| Factor | Codespace | Local |
|--------|-----------|-------|
| Setup | ~60 sec | ~5 min |
| Internet | Required | Only for AI calls |
| Docker | Built-in | Must install |
| Best for | **This hackathon** | Production dev |

---

## Verify Everything

```bash
./scripts/validate.sh

# Expected:
# ✓ Node.js v20.x
# ✓ Go 1.21.x
# ✓ Docker 24.x
# ✓ PostgreSQL + pgvector
# ✓ Redis connected
# ✓ RuVector embeddings healthy
# ✓ Claude Code available
# ✓ Claude Flow available
```

---

### [ILLUSTRATION: Side-by-side cards. Left: cloud icon "Codespace" with browser VS Code window, "60 sec" badge. Right: laptop icon "Local" with terminal, "5 min" badge. Both connect to GitHub repo at top. Green checkmarks flowing down.]

---
---

# Slide 06: ADRs & DDD - Guardrails for Agents
**Duration**: 4 minutes | **ADR**: PRES-006

---

## The Drift Problem

```
Without Guardrails:               With ADR/DDD Guardrails:

Iteration  1: Clean code           Iteration  1: Clean code
Iteration  5: Slight deviation     Iteration  5: ADR enforces pattern
Iteration 10: Conflicting styles   Iteration 10: DDD boundaries hold
Iteration 20: CHAOS               Iteration 20: Still aligned
```

> **Agent drift**: AI agents gradually deviate from architectural patterns
> over multiple iterations, producing inconsistent code.

---

## ADR = Architecture Decision Record

```
┌─────────────────────────────────────────┐
│       ADR-003: State Machine            │
├─────────────────────────────────────────┤
│  STATUS:    Accepted                    │
│  CONTEXT:   Proposals need a complex    │
│             lifecycle with 21 states    │
│  DECISION:  Configurable state machine  │
│             with guards & side effects  │
│  CONSEQUENCES:                          │
│    + Clear workflow visualization       │
│    + Per-tenant customization           │
│    - Complexity in state management     │
└─────────────────────────────────────────┘
```

---

## Our 10 ADRs

| ADR | Controls | Prevents |
|-----|----------|----------|
| **001** Clean Architecture | 4-layer dependency rule | Structural drift |
| **002** Multi-Tenancy RLS | Data isolation | Security drift |
| **003** State Machine | 21 states, 26 actions | Workflow drift |
| **004** Event-Driven | Domain events + outbox | Integration drift |
| **005** SF424 Forms | Federal form generation | Compliance drift |
| **006** JWT + RBAC | Auth + authorization | Security drift |
| **007** RESTful API | Response format | Behavioral drift |
| **008** RuVector Self-Learning | AI/ML integration | Architecture drift |
| **009** Scaffolding | Rapid assembly | Process drift |
| **010** E2E Testing | Playwright patterns | Quality drift |

---

## DDD = Domain-Driven Design

```
7 Bounded Contexts:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Proposal │→ │  Budget  │→ │  Award   │
└────┬─────┘  └──────────┘  └────┬─────┘
     ▼                           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  SF424   │  │Compliance│  │Financial │
└──────────┘  └──────────┘  └──────────┘
                   │
              ┌────▼─────┐
              │ Identity  │  (Shared Kernel)
              └──────────┘

Each agent works within ONE context.
Aggregates enforce consistency boundaries.
Domain events control integration.
```

---

## The 4-Layer Anti-Drift Stack

```
Layer 1: CLAUDE.md        → "Use hierarchical topology"
Layer 2: ADRs (10)        → Architectural patterns
Layer 3: DDD (7 contexts) → Domain boundaries
Layer 4: Swarm (reviewer) → Quality gate
```

---

### [ILLUSTRATION: Split-screen. Left: chaotic spaghetti code diverging (red). Right: clean parallel tracks with railway guardrails (green). ADR documents form the barrier between chaos and order. Dark background.]

---
---

# Slide 07: Repository Structure & Clean Architecture
**Duration**: 4 minutes | **ADR**: PRES-007

---

## Project Layout

```
huron-bangalore/
├── src/
│   ├── backend/                    # Go Clean Architecture
│   │   ├── cmd/server/             # main.go entry point
│   │   └── internal/
│   │       ├── domain/             # Pure business logic
│   │       │   ├── proposal/       # 21-state machine
│   │       │   ├── budget/         # F&A calculations
│   │       │   └── award/          # Award lifecycle
│   │       ├── application/        # Use cases & services
│   │       ├── infrastructure/     # Postgres, RuVector, Redis
│   │       └── interfaces/http/    # Handlers + middleware
│   │
│   └── frontend/                   # Next.js 14
│       ├── app/                    # App Router pages
│       │   ├── dashboard/          # Dashboard
│       │   ├── proposals/          # Proposal CRUD
│       │   └── search/             # Vector search
│       ├── components/             # React (shadcn/ui)
│       ├── lib/wasm/               # rvlite offline search
│       └── e2e/                    # Playwright tests
│
├── architecture/
│   ├── adrs/                       # 10 ADRs
│   └── ddd/                        # Bounded contexts, events
│
├── scripts/                        # setup.sh, demo.sh, validate.sh
├── docker-compose.yml              # Full stack
└── CLAUDE.md                       # AI agent instructions
```

---

## Clean Architecture: 4 Layers

```
┌───────────────────────────────────────┐
│      interfaces/http  (handlers)      │  ← HTTP, REST
│  ┌───────────────────────────────┐    │
│  │   application/  (use cases)   │    │  ← Orchestration
│  │  ┌───────────────────────┐    │    │
│  │  │   domain/  (entities)  │    │    │  ← PURE BUSINESS
│  │  │                       │    │    │     LOGIC
│  │  │  No dependencies on   │    │    │     (no imports
│  │  │  outer layers          │    │    │      from HTTP,
│  │  └───────────────────────┘    │    │      SQL, Redis)
│  └───────────────────────────────┘    │
│      infrastructure/  (postgres, etc) │  ← DB, cache, APIs
└───────────────────────────────────────┘

Dependencies flow INWARD only.
Infrastructure implements domain interfaces.
```

---

## Key Files

| File | You'll Work With |
|------|-----------------|
| `domain/proposal/states.go` | State machine (21 states) |
| `infrastructure/postgres/` | Database queries + RLS |
| `infrastructure/ruvector/` | Vector embedding calls |
| `interfaces/http/handlers/` | REST endpoints |
| `app/dashboard/page.tsx` | Dashboard page |
| `components/proposals/` | Search UI |
| `lib/wasm/vector-index.ts` | WASM offline search |
| `e2e/proposals.spec.ts` | Playwright tests |

---

### [ILLUSTRATION: Concentric circles -- Domain (gold center), Application (blue), Interfaces (teal), Infrastructure (gray). Arrows inward only. Go gopher on left, React atom on right. File paths annotated around the rings.]

---
---

# Slide 08: Database, Auth & Multi-Tenancy
**Duration**: 4 minutes | **ADR**: PRES-008

---

## PostgreSQL + pgvector + RLS

```
┌─────────────────────────────────────────────────┐
│           POSTGRESQL + PGVECTOR                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Row-Level Security (RLS)                       │
│  Every query auto-filtered by tenant_id         │
│                                                 │
│  Tables:                                        │
│  proposals (+ embedding vector(384))            │
│  budgets, awards, users, tenants, audit_log     │
│                                                 │
│  Extensions: pgvector, pgcrypto, uuid-ossp      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Row-Level Security in 4 Lines

```sql
-- 1. Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 2. Create policy
CREATE POLICY tenant_isolation ON proposals
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- 3. Middleware sets tenant on each request
SET LOCAL app.tenant_id = 'tenant-uuid-here';

-- 4. ALL queries now auto-filtered (you can't bypass it)
SELECT * FROM proposals;
-- Becomes: SELECT * FROM proposals WHERE tenant_id = '...'
```

---

## Request Flow

```
JWT Request
     │
┌────▼──────────────────────────────────────┐
│  1. Auth Middleware     Validate JWT       │
│  2. Tenant Middleware   SET LOCAL tenant   │
│  3. PostgreSQL          RLS enforces       │
│                         isolation on       │
│                         EVERY query        │
└───────────────────────────────────────────┘
```

---

## JWT + Role Hierarchy

```
system_admin
  └── tenant_admin
        ├── grants_admin
        ├── financial_officer
        ├── compliance_officer
        └── department_head
              └── researcher
                    └── viewer
```

---

## Migration Pattern

```sql
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE proposals (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title     TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'draft',
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index: O(log n) vector search
CREATE INDEX proposals_embedding_idx ON proposals
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

---

### [ILLUSTRATION: Three colored tenant zones (red, blue, green) in a database cylinder. RLS shields between each zone. JWT token decoding at top with tenant_id arrow flowing to the policy. Padlock icons. Security-focused design.]

---
---

# Slide 09: RuVector Deep Dive
**Duration**: 4 minutes | **ADR**: PRES-009

---

## The RuVector Ecosystem

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

| Component | What It Does | Latency |
|-----------|-------------|---------|
| **ruvector-postgres** | Server-side similarity search via pgvector HNSW | <30ms |
| **rvlite** (WASM) | Browser offline vector search, no server needed | <80ms |
| **ruvector-attention** | Self-attention re-ranking for relevance | <10ms |
| **ruvector-gnn** | Graph neural network for entity relationships | <50ms |

---

## The Search Pipeline

```
User: "NIH R01 grants for cancer research"
     │
     ▼
1. EMBED        Text → 384-dim vector (MiniLM-L6-v2)
     │
     ▼
2. SEARCH       Cosine similarity, HNSW index, threshold < 0.3
     │
     ▼
3. RANK         Attention re-scoring + GNN relationship boost
     │
     ▼
4. RESULTS      Top-K proposals with similarity scores
```

---

## pgvector SQL

```sql
SELECT id, title,
  1 - (embedding <=> query_vec) AS similarity
FROM proposals
WHERE tenant_id = current_setting('app.tenant_id')
ORDER BY embedding <=> query_vec
LIMIT 10;
```

---

## WASM Offline Fallback

```typescript
import { VectorIndex } from '@/lib/wasm/vector-index';

const index = await VectorIndex.initialize({
  dimensions: 384,
  maxElements: 10000,
  distanceMetric: 'cosine'
});

const results = await index.search(queryEmbedding, {
  topK: 10, threshold: 0.3
});
// Works completely offline in the browser
```

---

### [ILLUSTRATION: Left-to-right pipeline: query (blue) -> embedding (neural icon, teal) -> search (database, green) -> ranking (spotlight, amber) -> results (card list). Color gradient across the pipeline. Clean data-flow style.]

---
---

# Slide 10: Backend - Go Domain + API
**Duration**: 4 minutes | **ADR**: PRES-010

---

## Domain Entity

```go
// domain/proposal/entity.go
type Proposal struct {
    ID        uuid.UUID
    TenantID  uuid.UUID
    Title     string
    Status    ProposalStatus   // Value object
    PI        PersonRef        // Value object
    Budget    BudgetRef
}

// Pure business logic -- no HTTP, no SQL, no Redis
func (p *Proposal) Submit() error {
    if p.Status != StatusDraft {
        return ErrInvalidTransition
    }
    if p.Budget.IsEmpty() {
        return ErrBudgetRequired
    }
    p.Status = StatusSubmitted
    p.AddEvent(ProposalSubmitted{
        ProposalID:  p.ID,
        TenantID:    p.TenantID,
        SubmittedAt: time.Now(),
    })
    return nil
}
```

---

## Middleware Stack (6 Layers)

```
HTTP Request
     │
  1. CORS           Origin validation
  2. Rate Limiter   100 req/min/tenant
  3. Auth (JWT)     Token validation
  4. Tenant (RLS)   SET LOCAL tenant_id
  5. Logger         Structured logging (zerolog)
  6. AIDefence      Input sanitization
     │
     ▼
  HANDLER           Business logic
```

---

## API Endpoints

```
Proposals:
  GET    /api/v1/proposals           List
  POST   /api/v1/proposals           Create
  GET    /api/v1/proposals/:id       Get
  PUT    /api/v1/proposals/:id       Update
  POST   /api/v1/proposals/:id/submit  State transition

Search:
  POST   /api/v1/search              Semantic search
  GET    /api/v1/search/similar/:id  Find related

Health:
  GET    /api/v1/health              Healthcheck
```

---

## Server Entry Point

```go
// cmd/server/main.go
func main() {
    cfg := config.Load()
    db := postgres.NewPool(cfg.DatabaseURL)
    vectors := ruvector.NewClient(cfg.RuVectorURL)

    // Infrastructure implements domain interfaces
    proposalRepo := postgres.NewProposalRepo(db)

    // Application uses domain
    proposalSvc := application.NewProposalService(
        proposalRepo, vectors,
    )

    // Interfaces use application
    handler := http.NewProposalHandler(proposalSvc)
    router := http.NewRouter(handler)

    server := &http.Server{Addr: ":8080", Handler: router}
    server.ListenAndServe()
}
```

---

### [ILLUSTRATION: Vertical pipeline showing 6 middleware layers as horizontal gates, each with an icon (globe, clock, key, building, document, shield). Request enters top, handler at bottom. Go gopher standing beside the pipeline.]

---
---

# Slide 11: Frontend - Next.js Dashboard + WASM
**Duration**: 4 minutes | **ADR**: PRES-011

---

## Component Architecture

```
┌─────────────────────────────────────────┐
│         PAGE COMPONENTS                 │
│  (Server components -- data fetching)   │
│  app/dashboard/page.tsx                 │
│  app/proposals/page.tsx                 │
├─────────────────────────────────────────┤
│       DOMAIN COMPONENTS                 │
│  (proposals/, budgets/, awards/)        │
│  ProposalCard, ProposalSearch           │
│  BudgetTable, StatusBadge              │
├─────────────────────────────────────────┤
│         UI PRIMITIVES                   │
│  (shadcn/ui base)                       │
│  Button, Input, Card, Dialog, Table     │
└─────────────────────────────────────────┘
```

---

## Dashboard Page

```typescript
// app/dashboard/page.tsx
import { StatCard } from '@/components/dashboard/stat-card';
import { Pipeline } from '@/components/dashboard/pipeline';
import { SearchBar } from '@/components/dashboard/search-bar';

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();
  const pipeline = await fetchPipelineData();

  return (
    <div className="grid gap-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active Grants" value={stats.active} />
        <StatCard title="Pending Reviews" value={stats.pending} />
        <StatCard title="Total Budget" value={stats.budget} />
      </div>
      <Pipeline data={pipeline} />
      <SearchBar placeholder="Search proposals by meaning..." />
    </div>
  );
}
```

---

## Online + Offline Search

```
User types query
       │
  ┌────▼─────┐
  │ Online?  │
  └──┬────┬──┘
 Yes │    │ No
     ▼    ▼
 pgvector  rvlite WASM
 <30ms     <80ms
     └──┬──┘
        ▼
   Render Results
```

Both paths return the same result format.
Users don't notice the switch.

---

## Building with Claude Code

```bash
claude "Build a dashboard at app/dashboard/page.tsx with:
  - 3 stat cards (active grants, pending reviews, total budget)
  - A proposal status pipeline bar
  - Recent activity feed
  - Semantic search bar using RuVector
  Use shadcn/ui components and TanStack Query.
  Follow existing patterns in src/frontend/components/"
```

---

### [ILLUSTRATION: Browser mockup showing HCG dashboard. Top row: three stat cards with numbers. Middle: color-coded pipeline bar. Bottom: search bar with autocomplete dropdown showing similarity scores. Dark mode. Modern SaaS aesthetic.]

---
---

# Slide 12: Self-Learning & Self-Optimizing
**Duration**: 4 minutes | **ADR**: PRES-012

---

## SONA Self-Learning Engine

```
┌─────────────────────────────────────────────────────┐
│              SONA (Self-Optimizing Neural Arch)       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Mixture of Experts (MoE)                        │
│     Route queries to specialized models             │
│     Grant search vs budget query vs compliance      │
│                                                     │
│  2. HNSW Indexing                                   │
│     Self-organizing O(log n) search                 │
│     Learns optimal connection patterns              │
│                                                     │
│  3. EWC++ (Elastic Weight Consolidation)            │
│     Prevents catastrophic forgetting                │
│     Preserves important patterns while learning new │
│                                                     │
│  4. LoRA Fine-Tuning                                │
│     Low-rank adaptation per tenant                  │
│     Minimal compute, maximum impact                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Self-Learning Feedback Loop

```
Search: "cancer research grants NIH"
  → Results: #1 (0.92), #2 (0.88), #3 (0.85)

User clicks #3, reads for 45s, saves to favorites
  → LEARN: boost #3 for similar queries
  → EWC++: preserve existing knowledge
  → Store pattern in memory

Next similar search:
  → #3 now ranks #1 (relevance adjusted)
  → System got smarter without retraining
```

---

## Self-Optimizing Swarm

```
Iteration 1:  6 agents, 45s/task, 2 retries   ████████░░ 60%
  → Learns: tester is the bottleneck

Iteration 2:  7 agents, 30s/task, 1 retry     ████████░░ 80%
  → Learns: researcher idle, reassign

Iteration 3:  6 agents, 20s/task, 0 retries   ██████████ 100%
  → Optimal performance
```

---

## Memory Namespaces

```bash
# Store learned patterns
npx @claude-flow/cli@latest memory store \
  --namespace ruvector \
  --key "cancer-search-opt" \
  --value "Boost MeSH term embeddings 1.3x for NIH queries"

# Next agent retrieves automatically
npx @claude-flow/cli@latest memory search \
  --query "optimize cancer grant search" \
  --namespace ruvector

# 6 namespaces: patterns, ruvector, ddd, schema, adr, e2e
```

---

### [ILLUSTRATION: Two connected loops. Left loop: "Self-Learning" with brain icon, showing search->interact->learn->improve cycle. Right loop: "Self-Optimizing" with gear icon, showing swarm->measure->adjust->faster cycle. Both loops connected by shared memory in center. Neural aesthetic, purple/blue gradient.]

---
---

# Slide 13: Live Build - Prototype in Under 2 Hours
**Duration**: 4 minutes | **ADR**: PRES-013

---

## The 5-Phase Plan

```
Phase 1: SETUP (15 min)
  ├── Codespace launch
  ├── Environment validation (./scripts/validate.sh)
  ├── Docker compose up
  └── Verify all services healthy

Phase 2: BACKEND (30 min)
  ├── Domain entities + state machine
  ├── REST API handlers
  ├── RuVector integration
  └── RLS middleware

Phase 3: FRONTEND (30 min)
  ├── Dashboard layout + stat cards
  ├── Proposal CRUD pages
  ├── Vector search + WASM fallback
  └── Status pipeline visualization

Phase 4: INTEGRATION (30 min)
  ├── E2E testing (Playwright)
  ├── Multi-tenant demo data
  ├── Seed 20 proposals per tenant
  └── Final validation

Phase 5: DEMO PREP (15 min)
  ├── Demo script run-through
  └── Performance checks
```

---

## Phase 2: Backend Swarm

```bash
claude "Initialize a hierarchical swarm with 4 agents:
  - Researcher: Read ADR-001, ADR-002, ADR-003
  - Backend-dev: Implement proposal handlers in
    src/backend/internal/interfaces/http/handlers/
  - Backend-dev: Implement postgres repositories in
    src/backend/internal/infrastructure/postgres/
  - Tester: Write integration tests
  Follow Clean Architecture. Use RLS for tenant isolation."
```

---

## Phase 3: Frontend Swarm

```bash
claude "Initialize a hierarchical swarm with 4 agents:
  - Researcher: Read existing components in src/frontend/
  - Coder: Build dashboard at app/dashboard/page.tsx
  - Coder: Build proposal search with WASM fallback
  - Tester: Write Playwright E2E tests in e2e/"
```

---

## What You'll Have at the End

```
+ Go backend with Clean Architecture
+ Next.js 14 dashboard with App Router
+ PostgreSQL + pgvector semantic search
+ WASM offline search fallback
+ Multi-tenant RLS isolation
+ JWT authentication + RBAC
+ 21-state proposal workflow
+ Playwright E2E tests passing
+ Docker Compose full-stack deployment
+ Self-learning vector search
```

---

### [ILLUSTRATION: Timeline showing 5 phases as horizontal bars with agent swarm icons above phases 2-3. Progress indicator "0h -> 2h". Milestone markers between phases. Clean Gantt-style infographic.]

---
---

# Slide 14: Testing, Validation & Demo
**Duration**: 4 minutes | **ADR**: PRES-014

---

## Testing Pyramid

```
             /\
            /  \       E2E Tests (Playwright)
           /    \
          /──────\
         /        \    Integration (Go + PostgreSQL)
        /          \
       /────────────\
      /              \  Unit Tests (Domain logic)
     /                \
    /──────────────────\  WASM (rvlite browser tests)
```

---

## Playwright E2E Test

```typescript
test('create and submit a proposal', async ({ page }) => {
  await page.goto('/proposals/new');
  await page.fill('[name="title"]', 'NIH R01 Grant');
  await page.click('button[type="submit"]');

  await expect(page.locator('.status-badge'))
    .toHaveText('Draft');

  await page.click('button:has-text("Submit")');
  await expect(page.locator('.status-badge'))
    .toHaveText('Submitted');
});

test('semantic search finds relevant proposals', async ({ page }) => {
  await page.goto('/search');
  await page.fill('[name="search"]', 'cancer research NIH');

  const results = page.locator('.search-result');
  await expect(results).toHaveCount({ minimum: 1 });
});
```

---

## Running Tests

```bash
./scripts/test-e2e.sh              # All tests
./scripts/test-e2e.sh --headed     # Watch the browser
./scripts/test-e2e.sh --docker     # CI/CD mode
npx playwright test --trace on     # Debug failures
```

---

## Validation Checklist

```
Architecture
  [ ] Clean Architecture layers respected
  [ ] Domain has no external dependencies

Security
  [ ] RLS enabled on all tenant tables
  [ ] JWT validation on all endpoints

Functionality
  [ ] Proposal CRUD works
  [ ] Vector search returns results
  [ ] WASM fallback works offline
  [ ] Multi-tenant isolation verified

Performance
  [ ] Vector search < 50ms
  [ ] WASM search < 100ms
  [ ] API response < 200ms
```

---

### [ILLUSTRATION: Test results dashboard with green checkmarks. Left: test file tree. Center: pass/fail output. Right: coverage bars. Bottom: Playwright trace viewer screenshot. CI/CD dashboard aesthetic.]

---
---

# Slide 15: Wrap-Up - Your Agentic Future
**Duration**: 4 minutes | **ADR**: PRES-015

---

## What We Built

```
+ AI-powered grants management system
+ Go Clean Architecture backend
+ Next.js 14 modern frontend
+ PostgreSQL + pgvector semantic search
+ WASM offline vector search
+ Multi-tenant RLS data isolation
+ JWT + RBAC authentication
+ Self-learning search (SONA)
+ Swarm-orchestrated development
+ E2E tested with Playwright

Assembled in under 2 hours using Agentic Engineering.
```

---

## 8 Key Takeaways

| # | Principle |
|---|-----------|
| 1 | **ADRs are your guardrails** -- write them BEFORE agents code |
| 2 | **DDD gives agents context** -- bounded contexts prevent drift |
| 3 | **Hierarchical topology** -- best for hackathons and small teams |
| 4 | **CLAUDE.md is your control file** -- the AI reads this first |
| 5 | **Memory compounds** -- stored patterns improve every iteration |
| 6 | **Swarm > Solo** -- 6 agents always beats 1 agent |
| 7 | **Test everything** -- E2E tests validate the full stack |
| 8 | **Self-learning is real** -- RuVector SONA gets better over time |

---

## Your Next Steps

```
Today:
  1. Fork the repo: github.com/ruvnet/huron-bangalore
  2. Open a Codespace
  3. Run ./scripts/setup.sh
  4. Start building with Claude Code

This Week:
  5. Write your own ADRs for your domain
  6. Define your bounded contexts
  7. Set up Claude Flow swarms

This Month:
  8. Integrate RuVector self-learning
  9. Build your own CLAUDE.md
  10. Ship your AI-native application
```

---

## Resources

```
Code:
  github.com/ruvnet/huron-bangalore
  github.com/ruvnet/claude-flow
  github.com/ruvnet/ruvector

Docs:
  docs.anthropic.com/claude-code
  github.com/ruvnet/claude-flow
  github.com/ruvnet/ruvector
```

---

## Thank You, Bangalore!

```
╔═══════════════════════════════════════╗
║                                       ║
║  The future of software engineering   ║
║  is agentic. You now have the tools.  ║
║                                       ║
║  Go build something extraordinary.    ║
║                                       ║
║                           -- rUv      ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

### [ILLUSTRATION: Developer standing at the edge of a digital landscape, looking toward a horizon of floating AI agents and glowing code. HCG dashboard on a screen to their left. Bangalore skyline silhouette. Sunrise gradient (amber to blue). Inspirational future-tech aesthetic.]

---
---

# Appendix: Slide ADR Index

| ADR | Slide | Key Message |
|-----|-------|-------------|
| PRES-001 | Welcome & What We're Building | Reveal the grants system, meet rUv |
| PRES-002 | The Grants Management System | Domain, lifecycle, 7 bounded contexts |
| PRES-003 | Agentic Engineering | Intent-driven development with swarms |
| PRES-004 | The Toolchain | Claude Code + Claude Flow + RuVector |
| PRES-005 | Setup | Codespace 60-sec start |
| PRES-006 | ADRs & DDD | 4-layer anti-drift architecture |
| PRES-007 | Repo Structure | Clean Architecture, 4 layers |
| PRES-008 | Database & Auth | PostgreSQL + pgvector + RLS |
| PRES-009 | RuVector Deep Dive | 4 components, one search pipeline |
| PRES-010 | Backend | Go domain + middleware + API |
| PRES-011 | Frontend | Dashboard + WASM offline search |
| PRES-012 | Self-Learning | SONA engine + swarm optimization |
| PRES-013 | Live Build | 5-phase, 2-hour prototype |
| PRES-014 | Testing | Playwright + validation checklist |
| PRES-015 | Wrap-Up | 8 takeaways + next steps |

---

*Bangalore Hackathon -- Presented by rUv*
*Co-Authored-By: claude-flow <ruv@ruv.net>*
