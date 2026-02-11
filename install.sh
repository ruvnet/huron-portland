#!/bin/bash
# Huron Bangalore Hackathon - Environment Installation Script
# Installs Claude Code, Claude Flow, and all project dependencies

set -e

echo "=============================================="
echo "  Huron Bangalore Hackathon - Environment Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_warn "Running as root. Some installations may behave differently."
fi

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi
log_info "Detected OS: $OS"

# ============================================
# 1. Install Node.js (if not present)
# ============================================
log_info "Checking Node.js..."
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    if [ "$OS" == "linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" == "macos" ]; then
        brew install node@20
    else
        log_error "Please install Node.js manually: https://nodejs.org/"
        exit 1
    fi
else
    NODE_VERSION=$(node --version)
    log_info "Node.js already installed: $NODE_VERSION"
fi

# ============================================
# 2. Install Claude Code CLI
# ============================================
log_info "Installing Claude Code CLI..."
if ! command -v claude &> /dev/null; then
    npm install -g @anthropic-ai/claude-code
    log_info "Claude Code installed successfully"
else
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
    log_info "Claude Code already installed: $CLAUDE_VERSION"
fi

# ============================================
# 3. Install Claude Flow (alpha)
# ============================================
log_info "Installing Claude Flow (alpha)..."
npx @claude-flow/cli@latest --version || npm install -g @claude-flow/cli@latest
log_info "Claude Flow installed/updated"

# ============================================
# 4. Install Go (if not present)
# ============================================
log_info "Checking Go..."
if ! command -v go &> /dev/null; then
    log_info "Installing Go..."
    GO_VERSION="1.22.0"
    if [ "$OS" == "linux" ]; then
        wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
        sudo rm -rf /usr/local/go
        sudo tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
        rm "go${GO_VERSION}.linux-amd64.tar.gz"
        export PATH=$PATH:/usr/local/go/bin
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    elif [ "$OS" == "macos" ]; then
        brew install go
    else
        log_error "Please install Go manually: https://go.dev/dl/"
    fi
else
    GO_VERSION=$(go version)
    log_info "Go already installed: $GO_VERSION"
fi

# ============================================
# 5. Install Docker (check only)
# ============================================
log_info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    log_warn "Docker not found. Please install Docker Desktop or Docker Engine."
    log_warn "https://docs.docker.com/get-docker/"
else
    DOCKER_VERSION=$(docker --version)
    log_info "Docker available: $DOCKER_VERSION"
fi

# ============================================
# 6. Install project dependencies
# ============================================
log_info "Installing project dependencies..."

# Frontend dependencies
if [ -d "src/frontend" ]; then
    log_info "Installing frontend dependencies..."
    cd src/frontend
    npm install
    cd ../..
fi

# Backend dependencies
if [ -d "src/backend" ]; then
    log_info "Installing backend dependencies..."
    cd src/backend
    go mod download || log_warn "Go modules download skipped (may need to run later)"
    cd ../..
fi

# ============================================
# 7. Install Playwright for E2E testing
# ============================================
log_info "Installing Playwright browsers..."
if [ -d "src/frontend" ]; then
    cd src/frontend
    npx playwright install --with-deps chromium || log_warn "Playwright install skipped"
    cd ../..
fi

# ============================================
# 8. Setup bash aliases
# ============================================
log_info "Setting up bash aliases..."
ALIAS_FILE="/workspaces/huron-bangalore/.bashrc.aliases"
BASHRC="$HOME/.bashrc"

if [ -f "$ALIAS_FILE" ]; then
    # Check if already sourced
    if ! grep -q "huron-bangalore/.bashrc.aliases" "$BASHRC" 2>/dev/null; then
        echo "" >> "$BASHRC"
        echo "# Huron Bangalore Hackathon aliases" >> "$BASHRC"
        echo "[ -f $ALIAS_FILE ] && source $ALIAS_FILE" >> "$BASHRC"
        log_info "Aliases added to ~/.bashrc"
    else
        log_info "Aliases already configured in ~/.bashrc"
    fi
fi

# ============================================
# 9. Verify installation
# ============================================
echo ""
echo "=============================================="
log_info "Installation Summary"
echo "=============================================="
echo ""

check_cmd() {
    if command -v $1 &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1: $(${@:2} 2>/dev/null || echo 'installed')"
    else
        echo -e "  ${RED}✗${NC} $1: not found"
    fi
}

check_cmd node node --version
check_cmd npm npm --version
check_cmd claude claude --version
check_cmd go go version
check_cmd docker docker --version

echo ""
echo "=============================================="
log_info "Quick Start Commands"
echo "=============================================="
echo ""
echo "  # Reload shell to get aliases"
echo "  source ~/.bashrc"
echo ""
echo "  # Run Claude Code with permissions skipped"
echo "  dsp                    # claude --dangerously-skip-permissions"
echo "  dsp-c                  # claude -c --dangerously-skip-permissions"
echo ""
echo "  # Claude Flow commands"
echo "  cf swarm init          # Initialize swarm"
echo "  cf memory search       # Search memory"
echo ""
echo "  # Project commands"
echo "  ./scripts/setup.sh     # Start full stack"
echo "  ./scripts/demo.sh      # Run demo scenarios"
echo "  ./scripts/validate.sh  # Validate scaffolding"
echo ""
echo "=============================================="
log_info "Installation complete!"
echo "=============================================="
