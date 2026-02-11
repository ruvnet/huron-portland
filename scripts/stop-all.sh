#!/usr/bin/env bash
# Stop all Huron Grants services
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

cd "$PROJECT_ROOT"

REMOVE_VOLUMES=false
if [ "$1" = "--volumes" ] || [ "$1" = "-v" ]; then
    REMOVE_VOLUMES=true
fi

echo -e "${CYAN}[STOP]${NC} Stopping Docker Compose services..."
if [ "$REMOVE_VOLUMES" = true ]; then
    docker compose down -v --remove-orphans
    echo -e "${GREEN}[STOP]${NC} All services stopped and volumes removed"
else
    docker compose down --remove-orphans
    echo -e "${GREEN}[STOP]${NC} All services stopped (volumes preserved)"
fi

# Kill any local dev servers
echo -e "${CYAN}[STOP]${NC} Stopping local dev servers..."
pkill -f "next dev" 2>/dev/null && echo -e "${GREEN}[STOP]${NC} Stopped Next.js processes" || true
pkill -f "go run ./cmd/server" 2>/dev/null && echo -e "${GREEN}[STOP]${NC} Stopped Go backend" || true
pkill -f "vite.*3003" 2>/dev/null && echo -e "${GREEN}[STOP]${NC} Stopped presentation" || true

echo -e "${GREEN}[STOP]${NC} All services stopped."
