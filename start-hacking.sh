#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────
# Bangalore Hackathon — Quick Start
# ─────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║       Bangalore Hackathon — Agentic Engineering  ║${NC}"
echo -e "${CYAN}${BOLD}║       Building AI-Native Apps in Under 2 Hours   ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Presented by rUv (Reuven Cohen)${NC}"
echo -e "Creator of Claude Flow & RuVector"
echo ""

# ─── System Check ──────────────────────────────────
echo -e "${YELLOW}${BOLD}[1/4] System Check${NC}"
echo "──────────────────────────────────────"

check() {
  if command -v "$1" &>/dev/null; then
    local ver
    ver=$($2 2>&1 | head -1)
    echo -e "  ${GREEN}✓${NC} $1: $ver"
    return 0
  else
    echo -e "  ${RED}✗${NC} $1: not found"
    return 1
  fi
}

check "node" "node --version"
check "npm" "npm --version"
check "git" "git --version"
check "npx" "npx --version" || true

echo ""

# ─── Install Claude Flow CLI ─────────────────────
echo -e "${YELLOW}${BOLD}[2/4] Installing Claude Flow CLI${NC}"
echo "──────────────────────────────────────"

if npx @claude-flow/cli@latest --version &>/dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} @claude-flow/cli already available"
else
  echo "  Installing @claude-flow/cli@latest..."
  npm install -g @claude-flow/cli@latest
  echo -e "  ${GREEN}✓${NC} Installed"
fi

echo ""

# ─── Install Claude Code ─────────────────────────
echo -e "${YELLOW}${BOLD}[3/4] Installing Claude Code${NC}"
echo "──────────────────────────────────────"

if command -v claude &>/dev/null; then
  local_ver=$(claude --version 2>&1 | head -1)
  echo -e "  ${GREEN}✓${NC} Claude Code: $local_ver"
else
  echo "  Installing @anthropic-ai/claude-code..."
  npm install -g @anthropic-ai/claude-code
  echo -e "  ${GREEN}✓${NC} Installed"
fi

echo ""

# ─── Ready ────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[4/4] Ready to Hack${NC}"
echo "──────────────────────────────────────"
echo ""
echo -e "  ${CYAN}Presentation:${NC}  ./start-presentation.sh"
echo -e "  ${CYAN}Repo:${NC}          https://github.com/ruvnet/huron-bangalore"
echo -e "  ${CYAN}Claude Flow:${NC}   https://github.com/ruvnet/claude-flow"
echo ""
echo -e "${GREEN}${BOLD}Starting Claude Code...${NC}"
echo "──────────────────────────────────────"
echo ""

exec claude --dangerously-skip-permissions
