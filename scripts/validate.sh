#!/bin/bash
# Validation script for Huron Grants Scaffolding
# Verifies all components are ready for 1-hour demo assembly

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  Huron Grants Scaffolding Validation"
echo "================================================"
echo ""

PASS=0
FAIL=0

check() {
    if $2 >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAIL++))
    fi
}

echo "=== Prerequisites ==="
check "Go installed" "go version"
check "Node.js installed" "node --version"
check "Docker installed" "docker --version"
check "Docker Compose installed" "docker compose version"

echo ""
echo "=== Backend Validation ==="
check "Go modules valid" "cd src/backend && go mod verify"
check "Go compiles" "cd src/backend && go build -o /dev/null ./cmd/server/..."
check "Domain entities exist" "test -f src/backend/internal/domain/proposal/entity.go"
check "State machine exists" "test -f src/backend/internal/domain/proposal/states.go"
check "PostgreSQL repo exists" "test -f src/backend/internal/infrastructure/postgres/proposal_repo.go"
check "RuVector client exists" "test -f src/backend/internal/infrastructure/ruvector/client.go"

echo ""
echo "=== Frontend Validation ==="
check "package.json exists" "test -f src/frontend/package.json"
check "Node modules installed" "test -d src/frontend/node_modules"
check "Next.js builds" "cd src/frontend && npm run build"
check "WASM loader exists" "test -f src/frontend/lib/wasm/index.ts"
check "Vector search hook exists" "test -f src/frontend/lib/hooks/use-vector-search.ts"

echo ""
echo "=== Infrastructure Validation ==="
check "docker-compose.yml valid" "docker compose config --quiet"
check "Backend Dockerfile exists" "test -f src/backend/Dockerfile"
check "Frontend Dockerfile exists" "test -f src/frontend/Dockerfile"
check "Setup script exists" "test -x scripts/setup.sh"
check "Demo script exists" "test -x scripts/demo.sh"

echo ""
echo "=== Database Migrations ==="
check "Extensions migration" "test -f src/backend/internal/infrastructure/postgres/migrations/001_extensions.sql"
check "Tenants migration" "test -f src/backend/internal/infrastructure/postgres/migrations/002_tenants.sql"
check "Proposals migration" "test -f src/backend/internal/infrastructure/postgres/migrations/003_proposals.sql"
check "Seed data" "test -f src/backend/internal/infrastructure/postgres/migrations/999_seed_data.sql"

echo ""
echo "=== Architecture Documentation ==="
check "ADR-009 Scaffolding" "test -f architecture/adrs/ADR-009-scaffolding-framework.md"
check "Bounded Contexts" "test -f architecture/ddd/bounded-contexts.md"
check "Domain Events" "test -f architecture/ddd/domain-events.md"

echo ""
echo "=== Pretrained Memory ==="
PATTERNS=$(npx @claude-flow/cli@latest memory list --namespace patterns 2>/dev/null | grep -c "✓" || echo "0")
echo -e "${GREEN}✓${NC} Patterns namespace: ${PATTERNS} entries"

echo ""
echo "================================================"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "================================================"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All validations passed!${NC}"
    echo "Scaffolding is ready for 1-hour demo assembly."
    exit 0
else
    echo -e "${RED}Some validations failed.${NC}"
    exit 1
fi
