# Slide 09: Repository Structure Walkthrough
**Duration**: 3 minutes | **ADR**: PRES-009

---

## Project Layout

```
huron-bangalore/
│
├── src/
│   ├── backend/                    # Go Clean Architecture
│   │   ├── cmd/server/             # Entry point (main.go)
│   │   ├── internal/
│   │   │   ├── domain/             # Business logic (pure Go)
│   │   │   │   ├── proposal/       # Proposal aggregate
│   │   │   │   ├── budget/         # Budget aggregate
│   │   │   │   └── award/          # Award aggregate
│   │   │   ├── application/        # Use cases & services
│   │   │   ├── infrastructure/     # External systems
│   │   │   │   ├── postgres/       # DB repositories
│   │   │   │   ├── ruvector/       # Vector client
│   │   │   │   └── redis/          # Cache layer
│   │   │   └── interfaces/         # HTTP handlers
│   │   │       └── http/
│   │   │           ├── middleware/  # Auth, RLS, CORS
│   │   │           └── handlers/   # REST endpoints
│   │   └── pkg/                    # Shared utilities
│   │
│   ├── frontend/                   # Next.js 14
│   │   ├── app/                    # App Router
│   │   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── proposals/          # Proposal pages
│   │   │   └── api/                # API routes
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # Base UI (shadcn)
│   │   │   └── proposals/          # Domain components
│   │   ├── lib/
│   │   │   ├── api/                # Backend client
│   │   │   ├── wasm/               # rvlite search
│   │   │   └── hooks/              # React hooks
│   │   └── e2e/                    # Playwright tests
│   │
│   └── lib/                        # Shared code
│
├── architecture/
│   ├── adrs/                       # 10 ADRs
│   └── ddd/                        # DDD documentation
│       ├── bounded-contexts.md
│       ├── domain-events.md
│       └── aggregates.md
│
├── scripts/                        # Automation
│   ├── setup.sh                    # One-command setup
│   ├── demo.sh                     # Demo runner
│   ├── validate.sh                 # Pre-deploy checks
│   └── test-e2e.sh                 # E2E test runner
│
├── docker-compose.yml              # Full stack
├── CLAUDE.md                       # AI agent config
└── .env.example                    # Environment template
```

---

## Clean Architecture Dependency Rule

```
┌───────────────────────────────────┐
│         interfaces/http           │  ← Outer: Frameworks
│  ┌───────────────────────────┐    │
│  │      application/         │    │  ← Use Cases
│  │  ┌───────────────────┐    │    │
│  │  │     domain/        │    │    │  ← Core (pure business)
│  │  │                   │    │    │
│  │  │  No dependencies  │    │    │
│  │  │  on outer layers  │    │    │
│  │  └───────────────────┘    │    │
│  └───────────────────────────┘    │
│         infrastructure/           │  ← Outer: DB, API, Cache
└───────────────────────────────────┘

Dependencies flow INWARD only.
Domain knows nothing about HTTP, SQL, or Redis.
```

---

## Key Files You'll Touch

| File | You'll Use It For |
|------|------------------|
| `cmd/server/main.go` | Server startup, dependency injection |
| `domain/proposal/states.go` | State machine definitions |
| `infrastructure/postgres/` | Database queries |
| `infrastructure/ruvector/` | Vector embedding calls |
| `interfaces/http/handlers/` | REST API endpoints |
| `frontend/app/dashboard/` | Dashboard pages |
| `frontend/components/` | Reusable UI components |
| `frontend/lib/wasm/` | WASM vector search |

---

### [ILLUSTRATION: Folder tree visualization styled as a modern file explorer with icons for each folder type: Go gopher icon for backend, React atom for frontend, document icon for ADRs, gear icon for scripts. The Clean Architecture rings overlaid on the backend section. Blue-gray color scheme.]
