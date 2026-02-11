#!/usr/bin/env bash
# Start the full Huron Grants stack (DB + Backend + Frontend + Dashboard)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

MODE="${1:-hybrid}"  # hybrid (infra in docker, apps local) or docker (all docker)

echo -e "${CYAN}${BOLD}============================================${NC}"
echo -e "${CYAN}${BOLD} Huron Grants - Full Stack Startup${NC}"
echo -e "${CYAN}${BOLD}============================================${NC}"
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo ""

cd "$PROJECT_ROOT"

# Ensure .env
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${YELLOW}[SETUP]${NC} Created .env from .env.example"
fi

if [ "$MODE" = "docker" ]; then
    # All services in Docker
    echo -e "${CYAN}[STACK]${NC} Starting all services via Docker Compose..."
    docker compose up -d
    echo ""
    echo -e "${GREEN}${BOLD}All services starting in Docker.${NC}"
else
    # Infrastructure in Docker, apps locally
    echo -e "${CYAN}[1/4]${NC} Starting database services..."
    bash "$SCRIPT_DIR/start-db.sh"

    echo ""
    echo -e "${CYAN}[2/4]${NC} Starting embeddings service..."
    docker compose up -d embeddings 2>/dev/null || echo -e "${YELLOW}[SKIP]${NC} Embeddings service not available"

    echo ""
    echo -e "${CYAN}[3/4]${NC} Starting frontend + dashboard in background..."
    bash "$SCRIPT_DIR/start-frontend.sh" &
    FRONTEND_PID=$!

    bash "$SCRIPT_DIR/start-dashboard.sh" &
    DASHBOARD_PID=$!

    echo ""
    echo -e "${CYAN}[4/4]${NC} Starting backend..."
    echo -e "${YELLOW}[TIP]${NC}  Press Ctrl+C to stop all services"
    echo ""

    # Trap to clean up background processes
    trap "echo ''; echo 'Stopping...'; kill $FRONTEND_PID $DASHBOARD_PID 2>/dev/null; exit 0" INT TERM

    bash "$SCRIPT_DIR/start-backend.sh"
fi

echo ""
echo -e "${GREEN}${BOLD}Service URLs:${NC}"
echo -e "  Frontend:    http://localhost:3000"
echo -e "  Backend API: http://localhost:${BACKEND_PORT:-3001}"
echo -e "  Dashboard:   http://localhost:3002"
echo -e "  Embeddings:  http://localhost:${EMBEDDINGS_PORT:-8080}"
echo -e "  PostgreSQL:  localhost:${POSTGRES_PORT:-5432}"
