# Slide 08: How ADR/DDD Prevents Agent Drift
**Duration**: 4 minutes | **ADR**: PRES-008

---

## The Drift Problem

```
Without Guardrails:                With ADR/DDD Guardrails:

Iteration 1: Clean code            Iteration 1: Clean code
Iteration 2: Still good            Iteration 2: Still good
Iteration 3: Slight deviation      Iteration 3: ADR enforces pattern
Iteration 4: Different pattern     Iteration 4: DDD boundaries hold
Iteration 5: Inconsistent          Iteration 5: Consistent
  ...                                ...
Iteration 20: CHAOS                Iteration 20: Still aligned
```

---

## What is Agent Drift?

> Agent drift occurs when AI agents gradually deviate from
> architectural patterns over multiple iterations, producing
> inconsistent, conflicting, or architecturally unsound code.

---

## The 3 Drift Types

| Drift Type | Symptom | ADR/DDD Fix |
|------------|---------|-------------|
| **Structural** | Different file layouts per feature | ADR-001: Clean Architecture layers |
| **Behavioral** | Inconsistent error handling | ADR-007: API response format |
| **Domain** | Mixed bounded context logic | DDD: Aggregate boundaries |

---

## How Guardrails Work

```
┌────────────────────────────────────────────────┐
│         ANTI-DRIFT ARCHITECTURE                │
├────────────────────────────────────────────────┤
│                                                │
│  Layer 1: CLAUDE.md                            │
│  ┌────────────────────────────────────────┐    │
│  │ "Use hierarchical topology"            │    │
│  │ "Never save to root folder"            │    │
│  │ "Follow Clean Architecture patterns"   │    │
│  └────────────────────────────────────────┘    │
│                    │                           │
│  Layer 2: ADRs     ▼                           │
│  ┌────────────────────────────────────────┐    │
│  │ ADR-001: 4-layer dependency rule       │    │
│  │ ADR-002: RLS tenant isolation          │    │
│  │ ADR-003: State machine transitions     │    │
│  │ ADR-006: JWT + RBAC authorization      │    │
│  └────────────────────────────────────────┘    │
│                    │                           │
│  Layer 3: DDD      ▼                           │
│  ┌────────────────────────────────────────┐    │
│  │ Bounded contexts define scope          │    │
│  │ Aggregates enforce consistency         │    │
│  │ Domain events control integration      │    │
│  │ Value objects enforce types            │    │
│  └────────────────────────────────────────┘    │
│                    │                           │
│  Layer 4: Swarm    ▼                           │
│  ┌────────────────────────────────────────┐    │
│  │ Hierarchical topology (anti-drift)     │    │
│  │ Specialized agents (bounded roles)     │    │
│  │ Memory namespaces (shared knowledge)   │    │
│  │ Reviewer agent (quality gate)          │    │
│  └────────────────────────────────────────┘    │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Concrete Example: Adding a Feature

```
Task: "Add bulk proposal approval"

Without guardrails:
  Agent might: put logic in API handler, skip RLS, use
  different status names, skip events

With ADR/DDD guardrails:
  1. Agent reads ADR-001 → puts logic in domain layer
  2. Agent reads ADR-002 → adds tenant_id check
  3. Agent reads ADR-003 → uses defined state transitions
  4. Agent reads ADR-004 → emits ProposalApproved events
  5. Agent reads DDD    → stays within Proposal context
  6. Reviewer agent     → validates all rules followed
```

---

## The Memory Feedback Loop

```
     ┌────────────┐
     │  Agent      │
     │  writes     │
     │  code       │
     └──────┬─────┘
            │
     ┌──────▼─────┐     ┌──────────────┐
     │  Reviewer   │────→│  Store       │
     │  validates  │     │  pattern in  │
     │  against    │     │  memory      │
     │  ADR/DDD    │     └──────┬───────┘
     └──────┬─────┘            │
            │            ┌─────▼────────┐
     ┌──────▼─────┐     │  Next agent   │
     │  Fix if     │     │  retrieves   │
     │  drifted    │     │  pattern     │
     └────────────┘     └──────────────┘
```

---

### [ILLUSTRATION: Split-screen comparison. Left: "Without Guardrails" - chaotic spaghetti code lines diverging in all directions, red warning icons. Right: "With ADR/DDD" - clean parallel tracks with railway-style guardrails, green checkmarks. Center divider shows the ADR documents acting as the barrier. Dark background, high contrast.]
