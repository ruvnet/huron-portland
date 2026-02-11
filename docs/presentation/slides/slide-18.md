# Slide 18: Live Build - Prototype in Under 2 Hours
**Duration**: 4 minutes | **ADR**: PRES-018

---

## The 2-Hour Build Plan

```
┌─────────────────────────────────────────────────────┐
│         2-HOUR PROTOTYPE BUILD TIMELINE             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Phase 1: SETUP (15 min)                            │
│  ├── Codespace launch                               │
│  ├── Environment validation                         │
│  ├── Docker compose up                              │
│  └── Verify all services healthy                    │
│                                                     │
│  Phase 2: BACKEND (30 min)                          │
│  ├── Domain entities (proposal, budget)             │
│  ├── State machine implementation                   │
│  ├── REST API handlers                              │
│  ├── RuVector integration                           │
│  └── RLS middleware                                 │
│                                                     │
│  Phase 3: FRONTEND (30 min)                         │
│  ├── Dashboard layout                               │
│  ├── Proposal CRUD pages                            │
│  ├── Vector search component                        │
│  ├── WASM offline fallback                          │
│  └── Status pipeline visualization                  │
│                                                     │
│  Phase 4: INTEGRATION (30 min)                      │
│  ├── End-to-end flow testing                        │
│  ├── Multi-tenant demo setup                        │
│  ├── Seed data for demo                             │
│  ├── Playwright E2E tests                           │
│  └── Final validation                               │
│                                                     │
│  Phase 5: DEMO PREP (15 min)                        │
│  ├── Demo script rehearsal                          │
│  ├── Edge case handling                             │
│  └── Performance verification                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Setup Commands

```bash
# 1. Launch Codespace or clone locally
gh codespace create --repo ruvnet/huron-bangalore

# 2. Run setup script
./scripts/setup.sh

# 3. Verify everything
./scripts/validate.sh

# 4. Start Claude Code
export ANTHROPIC_API_KEY="sk-ant-..."
claude
```

---

## Phase 2: Backend with Swarm

```bash
# In Claude Code, spawn the backend swarm
claude "Initialize a hierarchical swarm with 4 agents
  to build the Go backend:
  - Researcher: Read ADR-001, ADR-002, ADR-003
  - Backend-dev: Implement proposal handlers in
    src/backend/internal/interfaces/http/handlers/
  - Backend-dev: Implement postgres repositories in
    src/backend/internal/infrastructure/postgres/
  - Tester: Write integration tests
  Follow Clean Architecture. Use RLS for tenant isolation."
```

---

## Phase 3: Frontend with Swarm

```bash
# Spawn frontend swarm
claude "Initialize a hierarchical swarm with 4 agents
  to build the Next.js frontend:
  - Researcher: Read existing components in src/frontend/
  - Coder: Build dashboard at app/dashboard/page.tsx
  - Coder: Build proposal search with WASM fallback
  - Tester: Write Playwright E2E tests in e2e/"
```

---

## Phase 4: Integration

```bash
# Full integration test
./scripts/test-e2e.sh

# Demo data seeding
claude "Seed the database with:
  - 3 tenants (University A, B, C)
  - 20 proposals per tenant in various states
  - Budget data with F&A rates
  - Vector embeddings for all proposal titles"
```

---

## What You'll Have at the End

```
✓ Go backend with Clean Architecture
✓ Next.js 14 dashboard with App Router
✓ PostgreSQL + pgvector semantic search
✓ WASM offline search fallback
✓ Multi-tenant RLS isolation
✓ JWT authentication + RBAC
✓ Proposal state machine (21 states)
✓ Budget management
✓ Playwright E2E tests passing
✓ Docker Compose full-stack deployment
✓ Self-learning vector search
✓ API documentation (OpenAPI)
```

---

### [ILLUSTRATION: Timeline/Gantt chart showing the 4 phases as horizontal bars. Phase 1 (green, short), Phase 2 (blue, medium), Phase 3 (purple, medium), Phase 4 (orange, medium), Phase 5 (green, short). Above each phase, small icons show what's being built. Agent swarm icons floating above phases 2-3 showing parallel work. A progress bar at the bottom shows "0h → 2h" with a running clock. Clean infographic style.]
