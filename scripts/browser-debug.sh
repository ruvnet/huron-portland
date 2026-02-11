#!/bin/bash
# =============================================================================
# Huron Grants Interactive Browser Debugging Session
# =============================================================================
# Tools for debugging E2E tests and browser interactions

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/src/frontend"

clear
echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}   Huron Grants Browser Debug Session${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""
echo -e "${BLUE}Select an option:${NC}"
echo ""
echo "  1) Open Playwright Inspector (step-through debugging)"
echo "  2) Run tests with browser visible"
echo "  3) Open Playwright UI mode"
echo "  4) Open last test report"
echo "  5) View test console logs"
echo "  6) Start dev server only"
echo "  7) Record new test (codegen)"
echo "  8) Run specific test file"
echo "  9) Trace viewer (analyze failures)"
echo "  0) Exit"
echo ""
read -p "Select option [0-9]: " opt

cd "$FRONTEND_DIR"

case $opt in
    1)
        echo ""
        echo -e "${CYAN}Opening Playwright Inspector...${NC}"
        echo -e "${YELLOW}Tip: Use the Inspector to step through tests, view selectors, and debug${NC}"
        echo ""
        PWDEBUG=1 npx playwright test --headed
        ;;
    2)
        echo ""
        echo -e "${CYAN}Running tests with browser visible...${NC}"
        echo ""
        npx playwright test --headed --reporter=list
        ;;
    3)
        echo ""
        echo -e "${CYAN}Opening Playwright UI mode...${NC}"
        echo -e "${YELLOW}Tip: UI mode provides real-time test execution and debugging${NC}"
        echo ""
        npx playwright test --ui
        ;;
    4)
        echo ""
        if [ -f "playwright-report/index.html" ]; then
            echo -e "${CYAN}Opening test report...${NC}"
            npx playwright show-report
        else
            echo -e "${RED}No test report found. Run tests first.${NC}"
            exit 1
        fi
        ;;
    5)
        echo ""
        echo -e "${CYAN}Recent test console logs:${NC}"
        echo ""
        if [ -f "test-results/results.json" ]; then
            # Parse and display console logs from test results
            if command -v jq &> /dev/null; then
                jq -r '.suites[].specs[].tests[].results[].stdout // empty' test-results/results.json 2>/dev/null || \
                    echo -e "${YELLOW}No console logs captured in last run${NC}"
            else
                echo -e "${YELLOW}Install jq for formatted output: apt-get install jq${NC}"
                echo ""
                cat test-results/results.json 2>/dev/null || echo "No results file found"
            fi
        else
            echo -e "${YELLOW}No test results found. Run tests first.${NC}"

            # Show any available log files
            if ls test-results/*.txt 2>/dev/null; then
                echo ""
                echo -e "${CYAN}Available log files:${NC}"
                ls -la test-results/*.txt 2>/dev/null
            fi
        fi
        ;;
    6)
        echo ""
        echo -e "${CYAN}Starting development server...${NC}"
        echo -e "${YELLOW}Frontend will be available at http://localhost:3000${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        npm run dev
        ;;
    7)
        echo ""
        echo -e "${CYAN}Starting Playwright codegen (test recorder)...${NC}"
        echo -e "${YELLOW}Tip: Interact with the browser and code will be generated automatically${NC}"
        echo ""
        read -p "Enter URL to record (default: http://localhost:3000): " url
        url=${url:-http://localhost:3000}
        npx playwright codegen "$url"
        ;;
    8)
        echo ""
        echo -e "${CYAN}Available test files:${NC}"
        echo ""
        if [ -d "e2e" ]; then
            ls -1 e2e/*.spec.ts 2>/dev/null || echo "No test files found in e2e/"
            echo ""
            read -p "Enter test file name (e.g., auth.spec.ts): " testfile
            if [ -n "$testfile" ]; then
                npx playwright test "e2e/$testfile" --headed --reporter=list
            fi
        else
            echo -e "${RED}No e2e directory found${NC}"
            exit 1
        fi
        ;;
    9)
        echo ""
        echo -e "${CYAN}Opening trace viewer...${NC}"
        echo -e "${YELLOW}Tip: Traces show step-by-step execution with screenshots${NC}"
        echo ""
        if ls test-results/**/trace.zip 2>/dev/null; then
            echo "Available traces:"
            ls -1 test-results/**/trace.zip
            echo ""
            read -p "Enter trace path or press Enter for latest: " trace
            if [ -z "$trace" ]; then
                trace=$(ls -t test-results/**/trace.zip 2>/dev/null | head -1)
            fi
            if [ -n "$trace" ]; then
                npx playwright show-trace "$trace"
            else
                echo -e "${RED}No trace files found${NC}"
            fi
        else
            echo -e "${YELLOW}No trace files found. Run tests with tracing enabled:${NC}"
            echo "  npx playwright test --trace on"
        fi
        ;;
    0)
        echo ""
        echo -e "${GREEN}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
