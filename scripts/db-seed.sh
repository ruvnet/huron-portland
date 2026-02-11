#!/usr/bin/env bash
# Seed the database with sample grant data
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

DB_USER="${POSTGRES_USER:-huron_admin}"
DB_NAME="${POSTGRES_DB:-huron_grants}"
CONTAINER="huron-grants-postgres"

echo -e "${CYAN}[SEED]${NC} Seeding database with sample data..."

if ! docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
    echo -e "${RED}[SEED]${NC} PostgreSQL is not running. Start it first: ./scripts/start-db.sh"
    exit 1
fi

docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Sample tenant
INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Huron University',
    'huron-university',
    '{"features": {"self_learning": true, "trajectory_tracking": true}}'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Sample University',
    'sample-university',
    '{"features": {"self_learning": true}}'
)
ON CONFLICT (slug) DO NOTHING;

-- Grants table
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

-- Sample grants
INSERT INTO grants (tenant_id, title, description, status, funding_amount, sponsor, submission_deadline)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AI Research Initiative', 'Machine learning for healthcare applications', 'active', 500000.00, 'NSF', '2026-06-30'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Climate Data Analysis', 'Climate modeling using satellite data', 'pending', 750000.00, 'DOE', '2026-04-15'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Biomedical Engineering Study', 'Novel prosthetics development', 'draft', 300000.00, 'NIH', '2026-08-01'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quantum Computing Research', 'Quantum error correction algorithms', 'active', 1200000.00, 'DARPA', '2026-12-01'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Educational Technology Grant', 'AI tutoring system development', 'pending', 250000.00, 'ED', '2026-05-15')
ON CONFLICT DO NOTHING;

SELECT 'Seeded ' || COUNT(*) || ' grants' AS status FROM grants;
EOF

echo -e "${GREEN}[SEED]${NC} Database seeded successfully."
