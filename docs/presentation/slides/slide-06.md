# Slide 06: What Are ADRs and Why They Matter
**Duration**: 3 minutes | **ADR**: PRES-006

---

## Architecture Decision Records (ADRs)

> An ADR is a short document that captures a single architectural decision,
> the context that led to it, and the consequences of making it.

---

## ADR Anatomy

```
┌─────────────────────────────────────────┐
│           ADR-003: State Machine        │
├─────────────────────────────────────────┤
│                                         │
│  STATUS:    Accepted                    │
│  DATE:      2024-01-15                  │
│  CONTEXT:   Proposals need a complex    │
│             lifecycle with 21 states    │
│                                         │
│  DECISION:  Use a configurable state    │
│             machine with guards and     │
│             side effects per tenant     │
│                                         │
│  CONSEQUENCES:                          │
│  + Clear workflow visualization         │
│  + Per-tenant customization             │
│  - Complexity in state management       │
│  - Migration effort for new states      │
│                                         │
└─────────────────────────────────────────┘
```

---

## Why ADRs for Agentic Engineering?

| Without ADRs | With ADRs |
|-------------|-----------|
| Agents make random architecture choices | Agents follow defined patterns |
| Conflicting code patterns across files | Consistent implementation |
| "Why was this built this way?" | Decision + context documented |
| Agent drift after 10+ iterations | Guardrails keep agents on track |
| Re-explaining context every session | Agents read ADRs automatically |

---

## Our 10 ADRs

```
architecture/adrs/
├── ADR-001-clean-architecture-ddd.md     # Foundation
├── ADR-002-multi-tenancy-rls.md          # Data isolation
├── ADR-003-state-machine.md              # Workflow engine
├── ADR-004-event-driven.md               # Integration
├── ADR-005-sf424-forms.md                # Domain-specific
├── ADR-006-jwt-rbac.md                   # Security
├── ADR-007-restful-api.md                # API design
├── ADR-008-ruvector-self-learning.md     # AI/ML
├── ADR-009-scaffolding-framework.md      # Rapid assembly
└── ADR-010-e2e-testing.md                # Quality
```

---

## ADRs as Agent Instructions

```markdown
# In CLAUDE.md, agents are told:

## Key Files Reference
| File | Purpose |
|------|---------|
| ADR-001 | Clean Architecture patterns |
| ADR-002 | Multi-tenancy RLS policies |
| ADR-003 | State machine (21 states) |

## Before implementing, agents MUST:
1. Read relevant ADRs
2. Follow defined patterns
3. Validate against architectural rules
```

---

### [ILLUSTRATION: A bookshelf metaphor where each ADR is a book spine, numbered 001-010. The shelf is labeled "Architectural Knowledge Base". An AI agent character is pulling ADR-003 from the shelf. Warm library tones with modern tech elements. Show the ADR content floating beside the open book.]
