# Slide 15: Middleware & API Layer
**Duration**: 3 minutes | **ADR**: PRES-015

---

## Middleware Stack

```
Request Flow:
┌─────────────────────────────────────────────────────┐
│  HTTP Request                                       │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  1. CORS Middleware                          │    │
│  │     Origin validation, preflight handling    │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  2. Rate Limiter                             │    │
│  │     Per-tenant token bucket (100 req/min)    │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  3. Auth Middleware (JWT)                    │    │
│  │     Token validation, user extraction        │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  4. Tenant Context (RLS)                     │    │
│  │     SET LOCAL app.tenant_id = extracted_id   │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  5. Request Logger                           │    │
│  │     Structured logging (zerolog)             │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  6. AIDefence Security                       │    │
│  │     Input sanitization, injection detection  │    │
│  └────┬────────────────────────────────────────┘    │
│       │                                             │
│  ┌────▼────────────────────────────────────────┐    │
│  │  HANDLER (business logic)                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## API Design (RESTful + OpenAPI)

```
┌─────────────────────────────────────────────────┐
│  API ENDPOINTS                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Proposals                                      │
│  GET    /api/v1/proposals          List          │
│  POST   /api/v1/proposals          Create        │
│  GET    /api/v1/proposals/:id      Get           │
│  PUT    /api/v1/proposals/:id      Update        │
│  POST   /api/v1/proposals/:id/submit  Transition │
│  GET    /api/v1/proposals/search   Vector search │
│                                                 │
│  Budgets                                        │
│  GET    /api/v1/budgets            List          │
│  POST   /api/v1/budgets            Create        │
│  GET    /api/v1/budgets/:id        Get           │
│                                                 │
│  Search                                         │
│  POST   /api/v1/search            Semantic       │
│  GET    /api/v1/search/similar/:id Related       │
│                                                 │
│  Health                                         │
│  GET    /api/v1/health             Healthcheck   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Response Format (JSON:API-inspired)

```json
{
  "data": {
    "id": "proposal-uuid",
    "type": "proposal",
    "attributes": {
      "title": "NIH R01 Cancer Research",
      "status": "under_review",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "relationships": {
      "budget": { "id": "budget-uuid" },
      "pi": { "id": "person-uuid" }
    }
  },
  "meta": {
    "request_id": "req-uuid",
    "tenant_id": "tenant-uuid"
  }
}
```

---

## Go Middleware Implementation

```go
// middleware/tenant.go
func TenantContext(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        claims := r.Context().Value("claims").(*JWTClaims)

        // Set PostgreSQL session variable for RLS
        _, err := db.Exec(r.Context(),
            "SET LOCAL app.tenant_id = $1",
            claims.TenantID,
        )
        if err != nil {
            http.Error(w, "tenant context failed", 500)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

---

### [ILLUSTRATION: Vertical pipeline diagram showing HTTP request flowing through 6 middleware layers (each as a horizontal bar/gate). Each layer has a small icon: globe (CORS), clock (rate limit), key (auth), building (tenant), document (logger), shield (security). Request enters from top, processed response exits from bottom. Clean technical diagram with numbered steps.]
