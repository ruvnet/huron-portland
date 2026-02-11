#!/usr/bin/env bash
# Start Next.js frontend application (local dev or Docker)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

MODE="${1:-local}"

echo -e "${CYAN}[FRONTEND]${NC} Starting Next.js frontend..."

if [ "$MODE" = "docker" ]; then
    echo -e "${CYAN}[FRONTEND]${NC} Using Docker..."
    cd "$PROJECT_ROOT"
    docker compose up -d frontend
    echo -e "${GREEN}[FRONTEND]${NC} Frontend running at http://localhost:${FRONTEND_PORT:-3000}"
else
    cd "$PROJECT_ROOT/src/frontend"

    if [ ! -d "node_modules" ]; then
        echo -e "${CYAN}[FRONTEND]${NC} Installing dependencies..."
        npm install
    fi

    echo -e "${CYAN}[FRONTEND]${NC} Starting dev server on http://localhost:3000"
    npm run dev
fi
