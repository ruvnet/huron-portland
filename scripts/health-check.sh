#!/usr/bin/env bash
# Health check for all Huron Grants services
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

cd "$PROJECT_ROOT"

echo -e "${CYAN}${BOLD}============================================${NC}"
echo -e "${CYAN}${BOLD} Huron Grants - Health Check${NC}"
echo -e "${CYAN}${BOLD}============================================${NC}"
echo ""

PASS=0
FAIL=0

check_service() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"

    if curl -sf --max-time "$timeout" "$url" >/dev/null 2>&1; then
        echo -e "  ${GREEN}OK${NC}  $name ($url)"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}FAIL${NC}  $name ($url)"
        FAIL=$((FAIL + 1))
    fi
}

check_docker() {
    local name="$1"
    local container="$2"

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
        if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
            echo -e "  ${GREEN}OK${NC}  $name (container: $container, status: $status)"
            PASS=$((PASS + 1))
        else
            echo -e "  ${YELLOW}WARN${NC}  $name (container: $container, status: $status)"
            FAIL=$((FAIL + 1))
        fi
    else
        echo -e "  ${RED}DOWN${NC}  $name (container: $container)"
        FAIL=$((FAIL + 1))
    fi
}

echo -e "${BOLD}Docker Services:${NC}"
check_docker "PostgreSQL" "huron-grants-postgres"
# Redis is optional - not used by backend code
# check_docker "Redis" "huron-grants-redis"
check_docker "Embeddings" "huron-grants-embeddings"
check_docker "Backend" "huron-grants-backend"
check_docker "Frontend" "huron-grants-frontend"

echo ""
echo -e "${BOLD}HTTP Endpoints:${NC}"
check_service "Backend API" "http://localhost:${BACKEND_PORT:-3001}/health"
check_service "Frontend" "http://localhost:${FRONTEND_PORT:-3000}"
check_service "Dashboard" "http://localhost:3002"
check_service "Embeddings" "http://localhost:${EMBEDDINGS_PORT:-8080}/health"
check_service "Presentation" "http://localhost:3003/presentation/"

echo ""
echo -e "${BOLD}Database Connectivity:${NC}"
if docker exec huron-grants-postgres pg_isready -U "${POSTGRES_USER:-huron_admin}" -d "${POSTGRES_DB:-huron_grants}" &>/dev/null; then
    TABLES=$(docker exec huron-grants-postgres psql -U "${POSTGRES_USER:-huron_admin}" -d "${POSTGRES_DB:-huron_grants}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    echo -e "  ${GREEN}OK${NC}  PostgreSQL ($TABLES tables)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}FAIL${NC}  PostgreSQL connection"
    FAIL=$((FAIL + 1))
fi

# Redis is optional - not used by backend code

echo ""
echo -e "${BOLD}Summary:${NC} ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
