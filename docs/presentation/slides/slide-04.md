# Slide 04: Installing Claude Flow & RuVector
**Duration**: 3 minutes | **ADR**: PRES-004

---

## Claude Flow V3: Swarm Orchestrator

```bash
# Install Claude Flow CLI
npm install -g @claude-flow/cli@latest

# Or use npx (no install needed)
npx @claude-flow/cli@latest --help

# Initialize swarm in your project
npx @claude-flow/cli@latest swarm init \
  --topology hierarchical \
  --max-agents 6 \
  --strategy specialized
```

---

## Claude Flow Architecture

```
┌────────────────────────────────────────────┐
│           CLAUDE FLOW V3                   │
├────────────────────────────────────────────┤
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  Swarm Controller                   │   │
│  │  - Topology: hierarchical/mesh      │   │
│  │  - Max Agents: configurable         │   │
│  │  - Strategy: specialized/general    │   │
│  └───────────┬─────────────────────────┘   │
│              │                             │
│  ┌───────────▼─────────────────────────┐   │
│  │  Memory System                      │   │
│  │  - Namespaced storage               │   │
│  │  - Pattern retrieval                │   │
│  │  - Cross-agent sharing              │   │
│  └───────────┬─────────────────────────┘   │
│              │                             │
│  ┌───────────▼─────────────────────────┐   │
│  │  Agent Pool                         │   │
│  │  researcher | architect | coder     │   │
│  │  tester | reviewer | backend-dev    │   │
│  └─────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

---

## RuVector Installation

```bash
# RuVector Core (Rust-based vector engine)
cargo install ruvector        # Full engine
npm install rvlite            # WASM for browsers

# RuVector PostgreSQL Extension
# (included in docker-compose.yml)
docker compose up -d postgres  # pgvector pre-installed

# RuVector Components
# ruvector-postgres  → Server-side vector search
# rvlite             → Client-side WASM search
# ruvector-attention → Self-attention mechanisms
# ruvector-gnn       → Graph neural networks
```

---

## RuVector in Docker Compose

```yaml
# From docker-compose.yml
services:
  ruvector-embeddings:
    image: ruvector/embeddings:latest
    environment:
      - MODEL_NAME=all-MiniLM-L6-v2
      - EMBEDDING_DIM=384
    ports:
      - "8082:8080"
```

---

## Quick Verification

```bash
# Verify all tools
claude --version              # Claude Code
npx @claude-flow/cli@latest   # Claude Flow
docker compose ps             # RuVector + Postgres

# Expected output:
# ✓ Claude Code v1.x
# ✓ Claude Flow v3.x
# ✓ postgres (healthy)
# ✓ ruvector-embeddings (healthy)
# ✓ redis (healthy)
```

---

### [ILLUSTRATION: Installation flow diagram showing three parallel install paths (npm, cargo, docker) converging into a unified "Ready" state. Use a circuit-board style design with nodes and connections. Color: green for success states, blue for process steps.]
