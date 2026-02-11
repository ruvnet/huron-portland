#!/usr/bin/env bash
# Run database migrations against PostgreSQL
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

DB_USER="${POSTGRES_USER:-huron_admin}"
DB_NAME="${POSTGRES_DB:-huron_grants}"
CONTAINER="huron-grants-postgres"

echo -e "${CYAN}[MIGRATE]${NC} Running database migrations..."

# Check postgres is running
if ! docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
    echo -e "${RED}[MIGRATE]${NC} PostgreSQL is not running. Start it first: ./scripts/start-db.sh"
    exit 1
fi

# Run init scripts if they exist
INIT_DIR="$PROJECT_ROOT/init-scripts"
if [ -d "$INIT_DIR" ]; then
    for sql_file in "$INIT_DIR"/*.sql; do
        [ -f "$sql_file" ] || continue
        filename=$(basename "$sql_file")
        echo -e "${CYAN}[MIGRATE]${NC} Applying $filename..."
        docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file"
        echo -e "${GREEN}[MIGRATE]${NC} Applied $filename"
    done
fi

# Run backend Go migrations if they exist
MIGRATION_DIR="$PROJECT_ROOT/src/backend/internal/infrastructure/postgres/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    for sql_file in "$MIGRATION_DIR"/*.sql; do
        [ -f "$sql_file" ] || continue
        filename=$(basename "$sql_file")
        echo -e "${CYAN}[MIGRATE]${NC} Applying $filename..."
        docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file"
        echo -e "${GREEN}[MIGRATE]${NC} Applied $filename"
    done
fi

# Show table count
TABLES=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}[MIGRATE]${NC} Done. $TABLES tables in database."
