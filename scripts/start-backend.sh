#!/usr/bin/env bash
# Start Go backend API service (local dev or Docker)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

MODE="${1:-local}"

echo -e "${CYAN}[BACKEND]${NC} Starting Go backend API..."

if [ "$MODE" = "docker" ]; then
    echo -e "${CYAN}[BACKEND]${NC} Using Docker..."
    cd "$PROJECT_ROOT"
    docker compose up -d backend
    echo -e "${GREEN}[BACKEND]${NC} Backend running at http://localhost:${BACKEND_PORT:-3001}"
else
    cd "$PROJECT_ROOT/src/backend"

    if ! command -v go &>/dev/null; then
        echo -e "${RED}[ERROR]${NC} Go is not installed. Install Go 1.22+ or use: $0 docker"
        exit 1
    fi

    echo -e "${CYAN}[BACKEND]${NC} Downloading Go modules..."
    go mod download

    echo -e "${CYAN}[BACKEND]${NC} Starting server on http://localhost:${PORT:-3001}"
    go run ./cmd/server
fi
