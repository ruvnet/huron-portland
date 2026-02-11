#!/usr/bin/env bash
# Start PostgreSQL (pgvector) via Docker Compose
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

cd "$PROJECT_ROOT"

# Ensure .env exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${YELLOW}[DB]${NC} Creating .env from .env.example..."
    cp .env.example .env
fi

echo -e "${CYAN}[DB]${NC} Starting PostgreSQL (pgvector)..."
docker compose up -d postgres

# Wait for PostgreSQL
echo -e "${CYAN}[DB]${NC} Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if docker exec huron-grants-postgres pg_isready -U "${POSTGRES_USER:-huron_admin}" -d "${POSTGRES_DB:-huron_grants}" &>/dev/null; then
        echo -e "${GREEN}[DB]${NC} PostgreSQL is ready"
        break
    fi
    [ "$i" -eq 30 ] && echo -e "${RED}[DB]${NC} PostgreSQL timeout" && exit 1
    sleep 2
done

# Verify pgvector
PGVECTOR=$(docker exec huron-grants-postgres psql -U "${POSTGRES_USER:-huron_admin}" -d "${POSTGRES_DB:-huron_grants}" -t -c "SELECT extname FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | tr -d ' ')
if [ "$PGVECTOR" = "vector" ]; then
    echo -e "${GREEN}[DB]${NC} pgvector extension enabled"
else
    echo -e "${YELLOW}[DB]${NC} pgvector extension not detected (may still be initializing)"
fi

echo ""
echo -e "${GREEN}[DB]${NC} Database running:"
echo -e "  PostgreSQL: localhost:${POSTGRES_PORT:-5432} (user: ${POSTGRES_USER:-huron_admin}, db: ${POSTGRES_DB:-huron_grants})"
