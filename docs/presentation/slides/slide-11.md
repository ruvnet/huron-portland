# Slide 11: Clean Architecture: Go Backend
**Duration**: 4 minutes | **ADR**: PRES-011

---

## Why Go + Clean Architecture?

| Benefit | Detail |
|---------|--------|
| **Fast compilation** | <15s for full build |
| **Strong typing** | Catches bugs at compile time |
| **Concurrency** | Goroutines for parallel processing |
| **Simple syntax** | AI agents produce cleaner Go code |
| **Single binary** | Easy Docker deployment |

---

## The 4 Layers

```
┌─────────────────────────────────────────────────────┐
│  LAYER 1: INTERFACES (HTTP Handlers)                │
│  src/backend/internal/interfaces/http/              │
│                                                     │
│  - REST handlers (proposals, budgets, awards)       │
│  - Middleware (auth, RLS, CORS, rate limit)          │
│  - Request/response DTOs                            │
│  - OpenAPI documentation                            │
│                                                     │
│  Depends on: Application layer                      │
├─────────────────────────────────────────────────────┤
│  LAYER 2: APPLICATION (Use Cases)                   │
│  src/backend/internal/application/                  │
│                                                     │
│  - Command handlers (CreateProposal, SubmitBudget)  │
│  - Query handlers (SearchProposals, GetBudget)      │
│  - Application services (ProposalService)           │
│  - DTOs and mappers                                 │
│                                                     │
│  Depends on: Domain layer                           │
├─────────────────────────────────────────────────────┤
│  LAYER 3: DOMAIN (Business Logic)                   │
│  src/backend/internal/domain/                       │
│                                                     │
│  - Entities (Proposal, Budget, Award)               │
│  - Value objects (Money, DateRange, TenantId)        │
│  - Domain events (ProposalSubmitted)                │
│  - Repository interfaces (not implementations)      │
│  - State machine (21 states, 26 actions)            │
│                                                     │
│  Depends on: NOTHING (pure business logic)          │
├─────────────────────────────────────────────────────┤
│  LAYER 4: INFRASTRUCTURE (External Systems)         │
│  src/backend/internal/infrastructure/               │
│                                                     │
│  - PostgreSQL repositories (pgx)                    │
│  - RuVector client (embedding + search)             │
│  - Redis cache (session, query cache)               │
│  - External API clients                             │
│                                                     │
│  Implements: Domain interfaces                      │
└─────────────────────────────────────────────────────┘
```

---

## Key Code Pattern: Domain Entity

```go
// domain/proposal/entity.go
type Proposal struct {
    ID          uuid.UUID
    TenantID    uuid.UUID
    Title       string
    Status      ProposalStatus  // Value object
    PI          PersonRef       // Value object
    Budget      BudgetRef
    CreatedAt   time.Time
    UpdatedAt   time.Time
    transitions []StateTransition
}

// Domain method - pure business logic
func (p *Proposal) Submit() error {
    if p.Status != StatusDraft {
        return ErrInvalidTransition
    }
    if p.Budget.IsEmpty() {
        return ErrBudgetRequired
    }
    p.Status = StatusSubmitted
    p.AddEvent(ProposalSubmitted{
        ProposalID: p.ID,
        TenantID:   p.TenantID,
        SubmittedAt: time.Now(),
    })
    return nil
}
```

---

## Server Entry Point

```go
// cmd/server/main.go (simplified)
func main() {
    cfg := config.Load()

    // Infrastructure
    db := postgres.NewPool(cfg.DatabaseURL)
    cache := redis.NewClient(cfg.RedisURL)
    vectors := ruvector.NewClient(cfg.RuVectorURL)

    // Repositories (infrastructure implements domain)
    proposalRepo := postgres.NewProposalRepo(db)

    // Services (application uses domain)
    proposalSvc := application.NewProposalService(
        proposalRepo, vectors, cache,
    )

    // Handlers (interfaces use application)
    handler := http.NewProposalHandler(proposalSvc)

    // Server
    router := http.NewRouter(handler)
    server := &http.Server{Addr: ":8080", Handler: router}
    server.ListenAndServe()
}
```

---

### [ILLUSTRATION: Concentric circles diagram with Domain at center (gold), Application ring (blue), Interfaces ring (teal), Infrastructure ring (gray). Arrows pointing inward only. Go gopher mascot standing beside the diagram. Each ring has small icons representing its components. Modern, clean design.]
