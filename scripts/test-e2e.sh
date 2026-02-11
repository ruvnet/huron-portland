#!/bin/bash
# =============================================================================
# Huron Grants E2E Testing Script
# =============================================================================
# Browser-based E2E testing with Playwright support for local and Docker modes

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}=== Huron Grants E2E Testing ===${NC}"
echo ""

# Parse arguments
HEADED=false
DEBUG=false
UI=false
DOCKER=false
SPEC=""
WORKERS=""

print_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --headed     Run tests with browser visible"
    echo "  --debug      Run tests in debug mode (Playwright Inspector)"
    echo "  --ui         Open Playwright UI mode"
    echo "  --docker     Run tests in Docker containers"
    echo "  --spec FILE  Run specific test file"
    echo "  --workers N  Number of parallel workers (default: auto)"
    echo "  -h, --help   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests headless"
    echo "  $0 --headed           # Run with browser visible"
    echo "  $0 --docker           # Run in Docker"
    echo "  $0 --spec auth.spec.ts  # Run specific test"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --ui)
            UI=true
            shift
            ;;
        --docker)
            DOCKER=true
            shift
            ;;
        --spec)
            SPEC="$2"
            shift 2
            ;;
        --workers)
            WORKERS="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Docker mode
if [ "$DOCKER" = true ]; then
    echo -e "${YELLOW}Running E2E tests in Docker...${NC}"
    echo ""

    # Clean up any previous test containers
    docker compose -f "$PROJECT_ROOT/docker-compose.test.yml" down --remove-orphans 2>/dev/null || true

    # Build and run tests
    docker compose -f "$PROJECT_ROOT/docker-compose.test.yml" up \
        --build \
        --abort-on-container-exit \
        --exit-code-from e2e-runner

    EXIT_CODE=$?

    # Copy test results from container
    echo ""
    echo -e "${CYAN}Copying test results...${NC}"
    docker cp huron-grants-e2e-runner:/app/test-results "$PROJECT_ROOT/src/frontend/" 2>/dev/null || true
    docker cp huron-grants-e2e-runner:/app/playwright-report "$PROJECT_ROOT/src/frontend/" 2>/dev/null || true

    # Clean up
    docker compose -f "$PROJECT_ROOT/docker-compose.test.yml" down --remove-orphans

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}E2E tests passed!${NC}"
    else
        echo -e "${RED}E2E tests failed!${NC}"
    fi

    echo ""
    echo -e "Test report: ${CYAN}$PROJECT_ROOT/src/frontend/playwright-report/index.html${NC}"
    exit $EXIT_CODE
fi

# Local mode
cd "$PROJECT_ROOT/src/frontend"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Install Playwright browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "/ms-playwright" ]; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install chromium --with-deps
fi

# Build test command
TEST_CMD="npx playwright test"

# Add spec file if provided
if [ -n "$SPEC" ]; then
    TEST_CMD="$TEST_CMD $SPEC"
fi

# Add workers if provided
if [ -n "$WORKERS" ]; then
    TEST_CMD="$TEST_CMD --workers=$WORKERS"
fi

# Run tests based on mode
echo -e "${GREEN}Running E2E tests...${NC}"
echo ""

if [ "$UI" = true ]; then
    echo -e "${CYAN}Opening Playwright UI...${NC}"
    npx playwright test --ui
elif [ "$DEBUG" = true ]; then
    echo -e "${CYAN}Starting debug mode (Playwright Inspector)...${NC}"
    PWDEBUG=1 $TEST_CMD --headed
elif [ "$HEADED" = true ]; then
    echo -e "${CYAN}Running with browser visible...${NC}"
    $TEST_CMD --headed --reporter=list
else
    echo -e "${CYAN}Running headless...${NC}"
    $TEST_CMD
fi

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}E2E tests passed!${NC}"
else
    echo -e "${RED}E2E tests failed!${NC}"
fi

echo ""
echo -e "Test report: ${CYAN}$PROJECT_ROOT/src/frontend/playwright-report/index.html${NC}"
echo -e "View report: ${CYAN}npx playwright show-report${NC}"

exit $EXIT_CODE
