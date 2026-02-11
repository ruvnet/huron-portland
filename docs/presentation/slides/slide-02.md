# Slide 02: The Agentic Toolchain
**Duration**: 4 minutes | **ADR**: PRES-002

---

## The Stack

```
┌─────────────────────────────────────────────────┐
│              YOUR AGENTIC TOOLCHAIN             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐   ┌──────────────────────┐   │
│  │  Claude Code  │   │    Claude Flow V3     │   │
│  │  (AI IDE)     │   │  (Swarm Orchestrator) │   │
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

| Tool | Role | What It Does |
|------|------|-------------|
| **Claude Code** | AI-powered CLI | Write, debug, refactor code with AI |
| **Claude Flow** | Swarm orchestrator | Coordinate multiple AI agents in parallel |
| **RuVector** | Vector intelligence | Semantic search, embeddings, self-learning |
| **pgvector** | Vector storage | PostgreSQL extension for similarity search |
| **rvlite** | Offline search | WASM-compiled vector search for browsers |

---

## How They Connect

```
Developer Intent
      │
      ▼
┌─ Claude Code ──────────────────────────┐
│  "Build a proposal search feature"     │
│           │                            │
│  ┌────────▼────────┐                   │
│  │  Claude Flow     │ ← ADR Guardrails │
│  │  Swarm Init      │                  │
│  └──┬──┬──┬──┬──┬──┘                   │
│     │  │  │  │  │                      │
│     ▼  ▼  ▼  ▼  ▼                      │
│    R  A  B  F  T   (5 parallel agents) │
└────────────────────────────────────────┘
      │
      ▼
Working Feature (tested, reviewed, documented)
```

R=Researcher, A=Architect, B=Backend, F=Frontend, T=Tester

---

### [ILLUSTRATION: Toolchain diagram as a layered pyramid. Top: Claude Code (blue). Middle: Claude Flow with agent icons. Bottom: RuVector family spread across the base. Arrows show data flow between layers. Clean, modern flat design.]
