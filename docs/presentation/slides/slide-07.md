# Slide 07: Domain-Driven Design for AI Agents
**Duration**: 4 minutes | **ADR**: PRES-007

---

## What is DDD?

> Domain-Driven Design structures code around the business domain,
> not technical layers. It gives AI agents a shared language
> to understand WHAT the system does.

---

## DDD Building Blocks

```
┌─────────────────────────────────────────────────┐
│              DDD BUILDING BLOCKS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  BOUNDED     │  │  Proposal Management     │  │
│  │  CONTEXT     │  │  Budget Management       │  │
│  │              │  │  Award Management        │  │
│  │  Autonomous  │  │  SF424 Forms             │  │
│  │  domains     │  │  Compliance              │  │
│  │  with clear  │  │  Financial Accounts      │  │
│  │  boundaries  │  │  Identity (Shared)       │  │
│  └─────────────┘  └──────────────────────────┘  │
│                                                 │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  AGGREGATE   │  │  Proposal (root)         │  │
│  │  ROOT        │  │  ├── TeamMember          │  │
│  │              │  │  ├── StateTransition     │  │
│  │  Consistency │  │  └── AttachmentRef       │  │
│  │  boundary    │  └──────────────────────────┘  │
│  └─────────────┘                                │
│                                                 │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  DOMAIN      │  │  ProposalSubmitted       │  │
│  │  EVENTS      │  │  BudgetApproved          │  │
│  │              │  │  AwardActivated          │  │
│  │  Integration │  │  ComplianceExpired       │  │
│  │  triggers    │  └──────────────────────────┘  │
│  └─────────────┘                                │
│                                                 │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  VALUE       │  │  Money (amount, currency) │  │
│  │  OBJECTS     │  │  DateRange               │  │
│  │              │  │  TenantId                │  │
│  │  Immutable   │  │  ProposalStatus          │  │
│  │  typed data  │  └──────────────────────────┘  │
│  └─────────────┘                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 7 Bounded Contexts

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Proposal    │────→│   Budget     │────→│    Award     │
│  Management  │     │  Management  │     │  Management  │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SF424      │     │  Compliance  │     │  Financial   │
│   Forms      │     │  Management  │     │  Accounts    │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │   Identity    │
                    │  (Shared      │
                    │   Kernel)     │
                    └──────────────┘
```

---

## Why DDD for AI Agents?

1. **Ubiquitous Language** - Agents use domain terms, not tech jargon
   - "Submit proposal" not "POST /api/v1/proposals/status"
2. **Clear Boundaries** - Each agent works within ONE context
   - Backend agent: Proposal Management only
3. **Event-Driven** - Agents trigger domain events, not side effects
   - `ProposalSubmitted` fires, downstream agents react
4. **Aggregate Rules** - Agents know consistency boundaries
   - "Budget must be approved before proposal submission"

---

### [ILLUSTRATION: A map-style diagram showing 7 bounded contexts as territories/islands with bridges (domain events) connecting them. Each island has its own color and icon. The Identity context is in the center as a shared hub. Style: clean cartographic illustration with modern tech aesthetics.]
