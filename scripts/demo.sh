#!/usr/bin/env bash
# =============================================================================
# Huron Grants Management System - Demo Helper Script
# =============================================================================
# Shows system status, displays API endpoints, and opens browser
# Usage: ./scripts/demo.sh [--status] [--endpoints] [--open] [--test]

set -e

# =============================================================================
# Colors and formatting
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# =============================================================================
# Configuration
# =============================================================================
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
EMBEDDINGS_URL="${EMBEDDINGS_URL:-http://localhost:8080}"

# =============================================================================
# Helper functions
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo -e "${CYAN}${BOLD} $1${NC}"
    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo ""
}

# Check if a URL is reachable
check_url() {
    local url=$1
    local name=$2

    if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
        log_success "$name ($url)"
        return 0
    else
        log_error "$name ($url)"
        return 1
    fi
}

# =============================================================================
# Show system status
# =============================================================================
show_status() {
    log_header "System Status"

    echo -e "${BOLD}Docker Services:${NC}"
    docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "Docker compose not available"

    echo ""
    echo -e "${BOLD}Service Health:${NC}"

    # Check Frontend
    check_url "$FRONTEND_URL" "Frontend"

    # Check Backend
    check_url "$BACKEND_URL/health" "Backend API"

    # Check Embeddings
    check_url "$EMBEDDINGS_URL/health" "Embeddings Service"

    # Check PostgreSQL
    if docker exec huron-grants-postgres pg_isready -U huron_admin -d huron_grants &>/dev/null 2>&1; then
        log_success "PostgreSQL (localhost:5432)"
    else
        log_error "PostgreSQL (localhost:5432)"
    fi

    # Redis removed from stack (not used by backend)

    echo ""
    echo -e "${BOLD}Database Stats:${NC}"
    docker exec huron-grants-postgres psql -U huron_admin -d huron_grants -c "
        SELECT
            (SELECT COUNT(*) FROM tenants) as tenants,
            (SELECT COUNT(*) FROM document_embeddings) as embeddings,
            (SELECT COUNT(*) FROM learning_patterns) as patterns;
    " 2>/dev/null || echo "Unable to query database"
}

# =============================================================================
# Show API endpoints
# =============================================================================
show_endpoints() {
    log_header "API Endpoints"

    echo -e "${BOLD}Base URLs:${NC}"
    echo -e "  Frontend:   ${CYAN}$FRONTEND_URL${NC}"
    echo -e "  Backend:    ${CYAN}$BACKEND_URL${NC}"
    echo -e "  Embeddings: ${CYAN}$EMBEDDINGS_URL${NC}"
    echo ""

    echo -e "${BOLD}Health Endpoints:${NC}"
    echo -e "  ${YELLOW}GET${NC}  $BACKEND_URL/health"
    echo -e "  ${YELLOW}GET${NC}  $BACKEND_URL/health/live"
    echo -e "  ${YELLOW}GET${NC}  $BACKEND_URL/health/ready"
    echo ""

    echo -e "${BOLD}Grants API (v1):${NC}"
    echo -e "  ${YELLOW}GET${NC}    $BACKEND_URL/api/v1/grants          - List all grants"
    echo -e "  ${GREEN}POST${NC}   $BACKEND_URL/api/v1/grants          - Create new grant"
    echo -e "  ${YELLOW}GET${NC}    $BACKEND_URL/api/v1/grants/{id}     - Get grant by ID"
    echo -e "  ${BLUE}PUT${NC}    $BACKEND_URL/api/v1/grants/{id}     - Update grant"
    echo -e "  ${RED}DELETE${NC} $BACKEND_URL/api/v1/grants/{id}     - Delete grant"
    echo ""

    echo -e "${BOLD}Documents API:${NC}"
    echo -e "  ${GREEN}POST${NC}   $BACKEND_URL/api/v1/documents/upload      - Upload document"
    echo -e "  ${GREEN}POST${NC}   $BACKEND_URL/api/v1/documents/categorize  - Categorize document"
    echo -e "  ${YELLOW}GET${NC}    $BACKEND_URL/api/v1/documents/{id}       - Get document"
    echo ""

    echo -e "${BOLD}Embeddings API:${NC}"
    echo -e "  ${GREEN}POST${NC}   $BACKEND_URL/api/v1/embeddings/generate   - Generate embedding"
    echo -e "  ${GREEN}POST${NC}   $BACKEND_URL/api/v1/embeddings/search     - Search embeddings"
    echo ""

    echo -e "${BOLD}Patterns API:${NC}"
    echo -e "  ${YELLOW}GET${NC}    $BACKEND_URL/api/v1/patterns             - List patterns"
    echo -e "  ${YELLOW}GET${NC}    $BACKEND_URL/api/v1/patterns/similar     - Find similar patterns"
    echo ""
}

# =============================================================================
# Open browser
# =============================================================================
open_browser() {
    log_header "Opening Browser"

    local url="${1:-$FRONTEND_URL}"

    log_info "Opening $url..."

    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$url"
        else
            log_error "Could not detect browser opener. Please open $url manually."
            return 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        start "$url"
    else
        log_error "Unknown OS. Please open $url manually."
        return 1
    fi

    log_success "Browser opened"
}

# =============================================================================
# Run API tests
# =============================================================================
run_tests() {
    log_header "Running API Tests"

    echo -e "${BOLD}Testing Health Endpoint:${NC}"
    echo -e "${YELLOW}curl -s $BACKEND_URL/health${NC}"
    curl -s "$BACKEND_URL/health" | jq . 2>/dev/null || curl -s "$BACKEND_URL/health"
    echo ""

    echo -e "${BOLD}Testing List Grants:${NC}"
    echo -e "${YELLOW}curl -s $BACKEND_URL/api/v1/grants${NC}"
    curl -s "$BACKEND_URL/api/v1/grants" | jq . 2>/dev/null || curl -s "$BACKEND_URL/api/v1/grants"
    echo ""

    echo -e "${BOLD}Testing Create Grant:${NC}"
    echo -e "${YELLOW}curl -s -X POST $BACKEND_URL/api/v1/grants -H 'Content-Type: application/json' -d '{\"title\":\"Test Grant\"}'${NC}"
    curl -s -X POST "$BACKEND_URL/api/v1/grants" \
        -H "Content-Type: application/json" \
        -d '{"title":"Test Grant","description":"Test Description"}' | jq . 2>/dev/null || \
    curl -s -X POST "$BACKEND_URL/api/v1/grants" \
        -H "Content-Type: application/json" \
        -d '{"title":"Test Grant","description":"Test Description"}'
    echo ""

    echo -e "${BOLD}Testing Document Categorization:${NC}"
    echo -e "${YELLOW}curl -s -X POST $BACKEND_URL/api/v1/documents/categorize -H 'Content-Type: application/json' -d '{\"content\":\"Grant application for research\"}'${NC}"
    curl -s -X POST "$BACKEND_URL/api/v1/documents/categorize" \
        -H "Content-Type: application/json" \
        -d '{"content":"Grant application for research"}' | jq . 2>/dev/null || \
    curl -s -X POST "$BACKEND_URL/api/v1/documents/categorize" \
        -H "Content-Type: application/json" \
        -d '{"content":"Grant application for research"}'
    echo ""

    log_success "Tests completed"
}

# =============================================================================
# Show logs
# =============================================================================
show_logs() {
    log_header "Service Logs"

    local service="${1:-}"

    if [ -n "$service" ]; then
        docker compose logs --tail=50 "$service" 2>/dev/null || docker-compose logs --tail=50 "$service"
    else
        docker compose logs --tail=20 2>/dev/null || docker-compose logs --tail=20
    fi
}

# =============================================================================
# Interactive menu
# =============================================================================
interactive_menu() {
    while true; do
        log_header "Huron Grants Demo Helper"

        echo -e "Please select an option:"
        echo ""
        echo -e "  ${CYAN}1${NC}) Show system status"
        echo -e "  ${CYAN}2${NC}) Show API endpoints"
        echo -e "  ${CYAN}3${NC}) Open frontend in browser"
        echo -e "  ${CYAN}4${NC}) Run API tests"
        echo -e "  ${CYAN}5${NC}) Show logs"
        echo -e "  ${CYAN}6${NC}) Show all (status + endpoints)"
        echo -e "  ${CYAN}q${NC}) Quit"
        echo ""
        read -p "Enter your choice: " choice

        case $choice in
            1) show_status ;;
            2) show_endpoints ;;
            3) open_browser ;;
            4) run_tests ;;
            5) show_logs ;;
            6)
                show_status
                show_endpoints
                ;;
            q|Q)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option: $choice"
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# =============================================================================
# Main
# =============================================================================
main() {
    case "${1:-}" in
        --status|-s)
            show_status
            ;;
        --endpoints|-e)
            show_endpoints
            ;;
        --open|-o)
            open_browser "${2:-}"
            ;;
        --test|-t)
            run_tests
            ;;
        --logs|-l)
            show_logs "${2:-}"
            ;;
        --all|-a)
            show_status
            show_endpoints
            ;;
        --help|-h)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --status, -s     Show system status"
            echo "  --endpoints, -e  Show API endpoints"
            echo "  --open, -o       Open frontend in browser"
            echo "  --test, -t       Run API tests"
            echo "  --logs, -l       Show service logs"
            echo "  --all, -a        Show status and endpoints"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Without options, starts interactive menu."
            ;;
        "")
            interactive_menu
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help to see available options"
            exit 1
            ;;
    esac
}

main "$@"
