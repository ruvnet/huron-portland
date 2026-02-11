#!/usr/bin/env bash
# View logs for Huron Grants services
# Usage: ./scripts/logs.sh [service] [--follow]
#   service: postgres | redis | backend | frontend | embeddings | all (default)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

SERVICE="${1:-}"
FOLLOW=""

# Check for --follow / -f flag
for arg in "$@"; do
    case "$arg" in
        -f|--follow) FOLLOW="-f" ;;
    esac
done

if [ -z "$SERVICE" ] || [ "$SERVICE" = "all" ] || [ "$SERVICE" = "-f" ]; then
    docker compose logs $FOLLOW --tail=100
else
    docker compose logs $FOLLOW --tail=100 "$SERVICE"
fi
