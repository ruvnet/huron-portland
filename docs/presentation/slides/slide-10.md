# Slide 10: Setting Up: Codespace vs Local GitHub
**Duration**: 3 minutes | **ADR**: PRES-010

---

## Two Paths to Get Started

```
┌──────────────────────┐     ┌──────────────────────┐
│   GITHUB CODESPACE   │     │    LOCAL SETUP        │
│   (Recommended)      │     │    (Advanced)         │
├──────────────────────┤     ├──────────────────────┤
│                      │     │                      │
│  ✓ Zero install      │     │  ✓ Full control      │
│  ✓ Pre-configured    │     │  ✓ Faster execution  │
│  ✓ Docker included   │     │  ✓ Offline capable   │
│  ✓ 60-sec start      │     │  ✓ Custom extensions │
│                      │     │                      │
│  Browser-based IDE   │     │  VS Code + Terminal  │
│  with all tools      │     │  with manual setup   │
│  pre-installed       │     │                      │
└──────────────────────┘     └──────────────────────┘
```

---

## Option A: GitHub Codespace (60 seconds)

```bash
# Step 1: Open the repo on GitHub
# https://github.com/ruvnet/huron-bangalore

# Step 2: Click "Code" → "Codespaces" → "Create codespace"
# Or use the CLI:
gh codespace create \
  --repo ruvnet/huron-bangalore \
  --machine largePremiumLinux

# Step 3: Wait ~60 seconds for setup
# Codespace includes: Node.js, Go, Docker, Rust, Claude Code

# Step 4: Start building
./scripts/setup.sh
```

---

## Option B: Local Setup (5 minutes)

```bash
# Step 1: Clone
git clone https://github.com/ruvnet/huron-bangalore.git
cd huron-bangalore

# Step 2: Prerequisites
# Install these if missing:
node --version    # v20+
go version        # 1.21+
docker --version  # 24+
cargo --version   # 1.70+ (optional, for rvlite)

# Step 3: Install tools
npm install -g @anthropic-ai/claude-code
npm install -g @claude-flow/cli@latest

# Step 4: Environment
cp .env.example .env
# Edit .env with your API keys

# Step 5: Launch
./scripts/setup.sh
```

---

## Environment Verification

```bash
# Run the validator
./scripts/validate.sh

# Expected output:
┌─────────────────────────────────────┐
│  VALIDATION RESULTS                 │
├─────────────────────────────────────┤
│  ✓ Node.js v20.x                   │
│  ✓ Go 1.21.x                       │
│  ✓ Docker 24.x                     │
│  ✓ PostgreSQL + pgvector           │
│  ✓ Redis connected                 │
│  ✓ RuVector embeddings healthy     │
│  ✓ Backend compiled                │
│  ✓ Frontend built                  │
│  ✓ Claude Code available           │
│  ✓ Claude Flow available           │
└─────────────────────────────────────┘
```

---

## Codespace vs Local Decision Matrix

| Factor | Codespace | Local |
|--------|-----------|-------|
| Setup time | ~60 sec | ~5 min |
| Internet required | Yes (always) | Only for AI calls |
| Docker support | Built-in | Must install |
| GPU access | Limited | Full |
| Cost | Free tier (60h/mo) | Free |
| Best for | Hackathons, quick start | Production dev |

> **For this hackathon: Use Codespaces.** Zero friction start.

---

### [ILLUSTRATION: Side-by-side comparison cards. Left card: Cloud icon with "Codespace" label, showing a browser window with VS Code. Right card: Laptop icon with "Local" label, showing a terminal window. Both cards connected to the same GitHub repository icon at the top. Clean, infographic style with blue/green accents.]
