#!/usr/bin/env bash
# =============================================================================
# Huron Grants Management System - Setup Script
# =============================================================================
# One-command setup for development environment
# Usage: ./scripts/setup.sh [--skip-seed] [--rebuild]

set -e

# =============================================================================
# Colors and formatting
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SKIP_SEED=false
REBUILD=false

# =============================================================================
# Helper functions
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo -e "${CYAN}${BOLD} $1${NC}"
    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo ""
}

# =============================================================================
# Parse arguments
# =============================================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-seed    Skip database seeding"
            echo "  --rebuild      Force rebuild of Docker images"
            echo "  -h, --help     Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# =============================================================================
# Check prerequisites
# =============================================================================
log_header "Checking Prerequisites"

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$1 is installed ($(command -v $1))"
        return 0
    else
        log_error "$1 is not installed"
        return 1
    fi
}

MISSING_DEPS=false

# Docker
if ! check_command "docker"; then
    MISSING_DEPS=true
fi

# Docker Compose
if docker compose version &> /dev/null; then
    log_success "docker compose is available"
elif check_command "docker-compose"; then
    DOCKER_COMPOSE="docker-compose"
else
    log_error "docker compose or docker-compose is not available"
    MISSING_DEPS=true
fi

# Node.js (optional, for local development)
if check_command "node"; then
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
fi

# Go (optional, for local development)
if check_command "go"; then
    GO_VERSION=$(go version)
    log_info "Go version: $GO_VERSION"
fi

if [ "$MISSING_DEPS" = true ]; then
    log_error "Missing required dependencies. Please install them and try again."
    exit 1
fi

# =============================================================================
# Setup environment
# =============================================================================
log_header "Setting Up Environment"

cd "$PROJECT_ROOT"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_info "Creating .env from .env.example..."
        cp .env.example .env
        log_success ".env file created"
        log_warning "Please review .env and update any necessary values"
    else
        log_warning ".env.example not found, using default environment"
    fi
else
    log_info ".env file already exists"
fi

# =============================================================================
# Start Docker services
# =============================================================================
log_header "Starting Docker Services"

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Stop existing containers if rebuild is requested
if [ "$REBUILD" = true ]; then
    log_info "Stopping existing containers..."
    $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
fi

# Build and start services
log_info "Starting infrastructure services (postgres, embeddings)..."

if [ "$REBUILD" = true ]; then
    $COMPOSE_CMD up -d --build postgres embeddings
else
    $COMPOSE_CMD up -d postgres embeddings
fi

# =============================================================================
# Wait for services to be healthy
# =============================================================================
log_header "Waiting for Services to be Ready"

wait_for_service() {
    local service=$1
    local max_attempts=${2:-30}
    local attempt=1

    log_info "Waiting for $service to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD ps "$service" | grep -q "healthy\|running"; then
            if docker exec "huron-grants-$service" echo "ready" &>/dev/null 2>&1; then
                log_success "$service is ready"
                return 0
            fi
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    log_error "$service failed to become ready within the timeout"
    return 1
}

# Wait for PostgreSQL
wait_for_postgres() {
    local max_attempts=30
    local attempt=1

    log_info "Waiting for PostgreSQL to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if docker exec huron-grants-postgres pg_isready -U huron_admin -d huron_grants &>/dev/null; then
            log_success "PostgreSQL is ready"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    log_error "PostgreSQL failed to become ready"
    return 1
}

wait_for_postgres

# =============================================================================
# Verify database initialization
# =============================================================================
log_header "Verifying Database Initialization"

log_info "Checking database tables..."
TABLES=$(docker exec huron-grants-postgres psql -U huron_admin -d huron_grants -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLES" -gt 0 ]; then
    log_success "Database initialized with $TABLES tables"
else
    log_warning "No tables found. Database may still be initializing..."
    sleep 5
fi

# Check for pgvector extension
PGVECTOR=$(docker exec huron-grants-postgres psql -U huron_admin -d huron_grants -t -c "SELECT extname FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | tr -d ' ')

if [ "$PGVECTOR" = "vector" ]; then
    log_success "pgvector extension is enabled"
else
    log_warning "pgvector extension may not be enabled"
fi

# =============================================================================
# Seed sample data (optional)
# =============================================================================
if [ "$SKIP_SEED" = false ]; then
    log_header "Seeding Sample Data"

    log_info "Inserting sample grant data..."

    docker exec huron-grants-postgres psql -U huron_admin -d huron_grants << 'EOF' 2>/dev/null || true
-- Insert sample data for development
INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Sample University',
    'sample-university',
    '{"features": {"self_learning": true, "trajectory_tracking": true}}'
)
ON CONFLICT (slug) DO NOTHING;

-- Create a sample grants table if it doesn't exist
CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    funding_amount DECIMAL(15,2),
    sponsor VARCHAR(255),
    submission_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample grants
INSERT INTO grants (tenant_id, title, description, status, funding_amount, sponsor, submission_deadline)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AI Research Initiative', 'Machine learning for healthcare applications', 'active', 500000.00, 'NSF', '2026-06-30'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Climate Data Analysis', 'Climate modeling using satellite data', 'pending', 750000.00, 'DOE', '2026-04-15'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Biomedical Engineering Study', 'Novel prosthetics development', 'draft', 300000.00, 'NIH', '2026-08-01')
ON CONFLICT DO NOTHING;

SELECT 'Sample data seeded successfully' AS status;
EOF

    log_success "Sample data seeded"
else
    log_info "Skipping database seeding (--skip-seed flag provided)"
fi

# =============================================================================
# Build and start application services
# =============================================================================
log_header "Building Application Services"

log_info "Building backend and frontend services..."

if [ "$REBUILD" = true ]; then
    $COMPOSE_CMD build backend frontend
fi

log_info "Starting backend service..."
$COMPOSE_CMD up -d backend

log_info "Starting frontend service..."
$COMPOSE_CMD up -d frontend

# =============================================================================
# Final health check
# =============================================================================
log_header "Performing Final Health Checks"

sleep 5

# Check all services
log_info "Checking service status..."
$COMPOSE_CMD ps

# Verify backend health
log_info "Checking backend health..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
        break
    fi
    sleep 2
done

# Verify frontend health
log_info "Checking frontend health..."
for i in {1..10}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
        break
    fi
    sleep 2
done

# =============================================================================
# Summary
# =============================================================================
log_header "Setup Complete!"

echo -e "${GREEN}${BOLD}All services are running!${NC}"
echo ""
echo -e "Service URLs:"
echo -e "  ${CYAN}Frontend:${NC}    http://localhost:3000"
echo -e "  ${CYAN}Backend API:${NC} http://localhost:3001"
echo -e "  ${CYAN}Embeddings:${NC}  http://localhost:8080"
echo ""
echo -e "Database:"
echo -e "  ${CYAN}PostgreSQL:${NC} localhost:5432 (user: huron_admin, db: huron_grants)"
echo ""
echo -e "Useful commands:"
echo -e "  ${YELLOW}docker compose logs -f${NC}         - View all logs"
echo -e "  ${YELLOW}docker compose logs -f backend${NC} - View backend logs"
echo -e "  ${YELLOW}docker compose down${NC}            - Stop all services"
echo -e "  ${YELLOW}./scripts/demo.sh${NC}              - Run demo helper"
echo ""
log_success "Happy coding!"
