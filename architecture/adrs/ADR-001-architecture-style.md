# ADR-001: Clean Architecture with Domain-Driven Design

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module requires a scalable, maintainable architecture that supports:
- Multi-tenant SaaS deployment (5000+ tenants, 500 concurrent users per tenant)
- Complex domain logic with state machines (21 proposal states, 26 award states)
- Strict compliance requirements (FedRamp, NIST, HIPAA, OWASP, SOC2)
- Integration with external systems (Grants.gov, Financial systems, HR systems)
- Performance targets: UI response <1s, API response <100ms

## Decision

We will adopt **Clean Architecture** (Hexagonal/Ports & Adapters) combined with **Domain-Driven Design (DDD)** for the backend implementation.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERFACES LAYER                        │
│  (HTTP Handlers, gRPC Services, CLI, Message Consumers)    │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                        │
│  (Use Cases, Application Services, DTOs, Command/Query)    │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                           │
│  (Entities, Value Objects, Aggregates, Domain Services,    │
│   Domain Events, Repository Interfaces)                     │
├─────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                       │
│  (Database, External APIs, Message Brokers, Caching)       │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rule

Dependencies point inward only:
- Infrastructure depends on Domain & Application
- Application depends on Domain
- Domain has no external dependencies

### Package Structure (Golang)

```
src/backend/
├── cmd/
│   └── api/                    # Application entry point
├── internal/
│   ├── domain/                 # Domain Layer
│   │   ├── proposal/           # Proposal Bounded Context
│   │   ├── budget/             # Budget Bounded Context
│   │   ├── award/              # Award Bounded Context
│   │   ├── sf424/              # SF424 Form Bounded Context
│   │   ├── compliance/         # Compliance Bounded Context
│   │   ├── account/            # Financial Account Bounded Context
│   │   └── identity/           # Person/Organization Bounded Context
│   ├── application/            # Application Layer
│   │   ├── commands/           # Command handlers (write operations)
│   │   ├── queries/            # Query handlers (read operations)
│   │   └── services/           # Application services
│   ├── infrastructure/         # Infrastructure Layer
│   │   ├── persistence/        # Database implementations
│   │   ├── messaging/          # Event bus, message queues
│   │   ├── external/           # External API clients
│   │   └── cache/              # Caching implementations
│   └── interfaces/             # Interface Layer
│       ├── http/               # REST API handlers
│       ├── grpc/               # gRPC services
│       └── events/             # Event consumers
└── pkg/                        # Shared utilities
```

## Rationale

1. **Testability**: Domain logic is isolated and can be unit tested without infrastructure
2. **Flexibility**: Infrastructure can be swapped without affecting business logic
3. **Compliance**: Clear separation aids security auditing and compliance verification
4. **Scalability**: Bounded contexts can be extracted to microservices if needed
5. **Team Alignment**: Clear boundaries enable parallel development

## Consequences

### Positive
- Clear separation of concerns
- High testability (target 80%+ code coverage)
- Independent deployability potential
- Easier onboarding for new developers

### Negative
- Initial development overhead for abstractions
- More files and boilerplate code
- Requires discipline to maintain layer boundaries

## Compliance Mapping

| Requirement | How Architecture Addresses |
|-------------|---------------------------|
| SOC2 | Audit logging in infrastructure layer |
| HIPAA | Data access control in domain layer |
| FedRamp | Security controls at interface layer |
| OWASP | Input validation at interface/application layers |

## References
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)
- HRS Grants Module Requirements Specifications v1.1
