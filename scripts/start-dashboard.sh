#!/usr/bin/env bash
# Start HeroUI + Three.js dashboard application
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

cd "$PROJECT_ROOT/src/dashboard"

if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}[DASHBOARD]${NC} Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo -e "${CYAN}[DASHBOARD]${NC} Starting dashboard on http://localhost:3002"
npm run dev
