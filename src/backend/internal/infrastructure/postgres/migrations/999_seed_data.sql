-- Migration: 999_seed_data.sql
-- Description: Seed data for development and demo environments
-- Author: System
-- Created: 2026-01-25
-- WARNING: This migration should ONLY run in development/demo environments

-- ============================================================================
-- Demo Tenant
-- ============================================================================
INSERT INTO tenants (id, name, subdomain, display_name, settings, feature_flags, subscription_tier) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Demo University',
    'demo',
    'Demo University Research Administration',
    '{
        "timezone": "America/New_York",
        "fiscalYearStart": "07-01",
        "defaultIndirectRate": 0.55,
        "reviewWorkflow": "standard",
        "emailNotifications": true
    }'::JSONB,
    '{
        "aiAssistant": true,
        "vectorSearch": true,
        "budgetForecasting": true,
        "collaborativeEditing": true,
        "advancedReporting": true
    }'::JSONB,
    'enterprise'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Tech Institute',
    'techinst',
    'Tech Institute Sponsored Programs',
    '{
        "timezone": "America/Los_Angeles",
        "fiscalYearStart": "10-01",
        "defaultIndirectRate": 0.52
    }'::JSONB,
    '{
        "aiAssistant": true,
        "vectorSearch": true,
        "budgetForecasting": false
    }'::JSONB,
    'professional'
);

-- ============================================================================
-- Demo Users
-- ============================================================================
INSERT INTO users (id, tenant_id, email, first_name, last_name, title, department, institution, orcid, is_active) VALUES
-- Demo University Users
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo-university.edu',
    'Sarah',
    'Administrator',
    'Director of Sponsored Programs',
    'Office of Research',
    'Demo University',
    NULL,
    TRUE
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'jane.smith@demo-university.edu',
    'Jane',
    'Smith',
    'Professor',
    'Computer Science',
    'Demo University',
    '0000-0002-1234-5678',
    TRUE
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'john.doe@demo-university.edu',
    'John',
    'Doe',
    'Associate Professor',
    'Environmental Science',
    'Demo University',
    '0000-0003-9876-5432',
    TRUE
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'maria.garcia@demo-university.edu',
    'Maria',
    'Garcia',
    'Assistant Professor',
    'Biomedical Engineering',
    'Demo University',
    '0000-0001-5555-6666',
    TRUE
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'robert.chen@demo-university.edu',
    'Robert',
    'Chen',
    'Research Scientist',
    'Physics',
    'Demo University',
    '0000-0002-7777-8888',
    TRUE
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'lisa.johnson@demo-university.edu',
    'Lisa',
    'Johnson',
    'Professor',
    'Chemistry',
    'Demo University',
    '0000-0001-2222-3333',
    TRUE
);

-- ============================================================================
-- Demo Sponsors
-- ============================================================================
INSERT INTO sponsors (id, tenant_id, name, abbreviation, sponsor_type, website, is_active) VALUES
(
    'aaaa1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'National Science Foundation',
    'NSF',
    'federal',
    'https://www.nsf.gov',
    TRUE
),
(
    'aaaa2222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'National Institutes of Health',
    'NIH',
    'federal',
    'https://www.nih.gov',
    TRUE
),
(
    'aaaa3333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Department of Energy',
    'DOE',
    'federal',
    'https://www.energy.gov',
    TRUE
),
(
    'aaaa4444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Bill & Melinda Gates Foundation',
    'BMGF',
    'foundation',
    'https://www.gatesfoundation.org',
    TRUE
),
(
    'aaaa5555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Defense Advanced Research Projects Agency',
    'DARPA',
    'federal',
    'https://www.darpa.mil',
    TRUE
),
(
    'aaaa6666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Amazon Research',
    NULL,
    'industry',
    'https://www.amazon.science',
    TRUE
);

-- ============================================================================
-- Demo Proposals
-- ============================================================================
INSERT INTO proposals (
    id, tenant_id, title, abstract, status, proposal_type,
    pi_id, created_by, sponsor_id, opportunity_id,
    submission_deadline, project_start_date, project_end_date,
    keywords, metadata
) VALUES
-- Proposal 1: AI Climate Modeling
(
    'bbbb1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'AI-Enhanced Climate Modeling for Agricultural Sustainability',
    'This proposal seeks funding to develop advanced machine learning models that integrate satellite imagery, weather data, and soil sensors to predict crop yields and optimize irrigation schedules. Our approach combines transformer architectures with physics-informed neural networks to achieve unprecedented accuracy in climate impact prediction for agricultural systems. The research will produce open-source tools for farmers and agricultural researchers worldwide.',
    'draft',
    'new',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaa1111-1111-1111-1111-111111111111',
    'NSF-2024-AGR-001',
    '2026-03-15 17:00:00-05',
    '2026-09-01',
    '2029-08-31',
    ARRAY['machine learning', 'climate modeling', 'agriculture', 'sustainability', 'AI'],
    '{"fundingAmount": 750000, "durationMonths": 36}'::JSONB
),
-- Proposal 2: Quantum Computing
(
    'bbbb2222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Quantum Error Correction for Fault-Tolerant Computing',
    'We propose to develop novel quantum error correction codes that significantly reduce the overhead required for fault-tolerant quantum computation. Our approach leverages topological properties of quantum states combined with machine learning optimization to achieve error thresholds previously thought impossible. This work will accelerate the timeline for practical quantum computers.',
    'in_review',
    'new',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaa1111-1111-1111-1111-111111111111',
    'NSF-2024-QIS-042',
    '2026-02-28 17:00:00-05',
    '2026-07-01',
    '2029-06-30',
    ARRAY['quantum computing', 'error correction', 'fault tolerance', 'topological codes'],
    '{"fundingAmount": 1200000, "durationMonths": 36}'::JSONB
),
-- Proposal 3: Biomedical Device
(
    'bbbb3333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Wireless Neural Interface for Treatment of Parkinsons Disease',
    'This project will develop a next-generation wireless neural interface capable of both recording and stimulating deep brain structures with unprecedented precision. The device will enable closed-loop deep brain stimulation for Parkinsons disease, automatically adjusting stimulation parameters based on real-time neural activity. Our miniaturized design eliminates the need for external components.',
    'approved',
    'new',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaa2222-2222-2222-2222-222222222222',
    'NIH-R01-NS-2024-150',
    '2026-01-15 17:00:00-05',
    '2026-04-01',
    '2031-03-31',
    ARRAY['neural interface', 'Parkinsons disease', 'deep brain stimulation', 'biomedical devices'],
    '{"fundingAmount": 2500000, "durationMonths": 60}'::JSONB
),
-- Proposal 4: Renewable Energy
(
    'bbbb4444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'High-Efficiency Perovskite-Silicon Tandem Solar Cells',
    'We propose to develop tandem solar cells combining perovskite and silicon that exceed 35% power conversion efficiency. Our novel interface engineering approach addresses the key stability and scalability challenges that have limited perovskite deployment. The project includes demonstration of manufacturing processes compatible with existing silicon cell production lines.',
    'submitted',
    'new',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'aaaa3333-3333-3333-3333-333333333333',
    'DOE-EERE-2024-0892',
    '2025-12-01 17:00:00-05',
    '2026-06-01',
    '2029-05-31',
    ARRAY['solar cells', 'perovskite', 'renewable energy', 'photovoltaics', 'tandem cells'],
    '{"fundingAmount": 1800000, "durationMonths": 36}'::JSONB
),
-- Proposal 5: Global Health
(
    'bbbb5555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'mRNA Vaccine Platform for Emerging Infectious Diseases',
    'This proposal outlines the development of a rapid-response mRNA vaccine platform capable of producing candidate vaccines within 48 hours of pathogen sequence identification. Our thermostable formulation eliminates cold-chain requirements, enabling deployment in resource-limited settings. We will demonstrate efficacy against three emerging viral threats.',
    'routing',
    'new',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaa4444-4444-4444-4444-444444444444',
    'BMGF-GH-2024-0156',
    '2026-04-01 17:00:00-05',
    '2026-10-01',
    '2029-09-30',
    ARRAY['mRNA vaccines', 'infectious diseases', 'global health', 'vaccine platform'],
    '{"fundingAmount": 3200000, "durationMonths": 36}'::JSONB
),
-- Proposal 6: Autonomous Systems
(
    'bbbb6666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Adversarial Robustness for Autonomous Vehicle Perception',
    'We propose fundamental research into making autonomous vehicle perception systems robust against adversarial attacks and edge cases. Our approach combines formal verification with adaptive learning to guarantee safety bounds while maintaining performance. The research addresses critical safety concerns that currently limit autonomous vehicle deployment.',
    'draft',
    'new',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaa5555-5555-5555-5555-555555555555',
    'DARPA-AV-2024-001',
    '2026-05-15 17:00:00-05',
    '2026-11-01',
    '2028-10-31',
    ARRAY['autonomous vehicles', 'adversarial robustness', 'computer vision', 'safety'],
    '{"fundingAmount": 2100000, "durationMonths": 24}'::JSONB
),
-- Proposal 7: Continuation
(
    'bbbb7777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    'Continuation: Scalable Federated Learning Infrastructure',
    'Year 3 continuation of our federated learning infrastructure project. We have successfully demonstrated privacy-preserving model training across 50 hospitals. This continuation will expand to 200 sites and add differential privacy guarantees with formal proofs.',
    'pending_approval',
    'continuation',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaa6666-6666-6666-6666-666666666666',
    'AMZ-ML-2022-CONT',
    '2026-02-01 17:00:00-05',
    '2026-03-01',
    '2027-02-28',
    ARRAY['federated learning', 'privacy', 'healthcare', 'machine learning'],
    '{"fundingAmount": 500000, "durationMonths": 12, "yearNumber": 3}'::JSONB
),
-- Proposal 8: Resubmission
(
    'bbbb8888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    'Microplastics Detection and Remediation in Marine Ecosystems (Resubmission)',
    'Resubmission addressing reviewer concerns about detection sensitivity. We now propose a novel Raman spectroscopy approach achieving 100nm detection limits, combined with engineered enzyme systems for biodegradation. Preliminary data demonstrates 95% degradation of common microplastics within 72 hours.',
    'draft',
    'resubmission',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaa1111-1111-1111-1111-111111111111',
    'NSF-2024-OCE-R01',
    '2026-06-01 17:00:00-05',
    '2026-12-01',
    '2029-11-30',
    ARRAY['microplastics', 'marine ecosystems', 'remediation', 'spectroscopy', 'enzymes'],
    '{"fundingAmount": 890000, "durationMonths": 36, "previousSubmissionId": "NSF-2023-OCE-145"}'::JSONB
);

-- ============================================================================
-- Demo Proposal Collaborators
-- ============================================================================
INSERT INTO proposal_collaborators (proposal_id, user_id, role, permissions) VALUES
-- AI Climate Modeling - multiple collaborators
(
    'bbbb1111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'co_pi',
    '{"read": true, "write": true, "budget": true}'::JSONB
),
(
    'bbbb1111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'key_personnel',
    '{"read": true, "write": true, "budget": false}'::JSONB
),
-- Quantum Computing
(
    'bbbb2222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'co_pi',
    '{"read": true, "write": true, "budget": true}'::JSONB
);

-- ============================================================================
-- Demo Budgets
-- ============================================================================
INSERT INTO proposal_budgets (
    id, proposal_id, tenant_id, name, currency,
    indirect_cost_rate, indirect_cost_base, status
) VALUES
(
    'cccc1111-1111-1111-1111-111111111111',
    'bbbb1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Primary Budget',
    'USD',
    0.55,
    'mtdc',
    'draft'
),
(
    'cccc2222-2222-2222-2222-222222222222',
    'bbbb3333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Primary Budget',
    'USD',
    0.52,
    'mtdc',
    'approved'
);

-- Budget periods for AI Climate proposal
INSERT INTO budget_periods (id, budget_id, period_number, name, start_date, end_date) VALUES
(
    'dddd1111-1111-1111-1111-111111111111',
    'cccc1111-1111-1111-1111-111111111111',
    1,
    'Year 1',
    '2026-09-01',
    '2027-08-31'
),
(
    'dddd2222-2222-2222-2222-222222222222',
    'cccc1111-1111-1111-1111-111111111111',
    2,
    'Year 2',
    '2027-09-01',
    '2028-08-31'
),
(
    'dddd3333-3333-3333-3333-333333333333',
    'cccc1111-1111-1111-1111-111111111111',
    3,
    'Year 3',
    '2028-09-01',
    '2029-08-31'
);

-- Sample line items for Year 1
INSERT INTO budget_line_items (
    period_id, category_id, description, quantity, unit, unit_cost,
    person_id, person_months, base_salary, justification
) VALUES
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000001',
    'PI - John Doe (2 summer months)',
    1,
    'person',
    25000.00,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    2.0,
    150000.00,
    'PI will lead the project during summer months, focusing on model development and team coordination.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000001',
    'Postdoctoral Researcher',
    1,
    'person',
    65000.00,
    NULL,
    12.0,
    65000.00,
    'Full-time postdoc to develop machine learning models and analyze satellite imagery.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000001',
    'Graduate Research Assistant',
    2,
    'person',
    30000.00,
    NULL,
    12.0,
    30000.00,
    'Two PhD students to support data collection and model validation.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000002',
    'Fringe Benefits - PI',
    1,
    'lump',
    7500.00,
    NULL,
    NULL,
    NULL,
    'PI fringe at 30% of salary.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000003',
    'GPU Computing Workstation',
    1,
    'each',
    15000.00,
    NULL,
    NULL,
    NULL,
    'High-performance workstation with NVIDIA A100 GPU for model training.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000004',
    'Conference Travel - Domestic',
    2,
    'trips',
    2000.00,
    NULL,
    NULL,
    NULL,
    'Attendance at AGU Fall Meeting and related conferences for dissemination.'
),
(
    'dddd1111-1111-1111-1111-111111111111',
    'a0000001-0001-0001-0001-000000000006',
    'Cloud Computing Credits',
    12,
    'months',
    1500.00,
    NULL,
    NULL,
    NULL,
    'AWS/GCP credits for large-scale model training and data processing.'
);

-- ============================================================================
-- Demo Compliance Records
-- ============================================================================
INSERT INTO compliance_templates (
    id, tenant_id, code, name, description, requirements, is_active
) VALUES
(
    'eeee1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'NSF-STANDARD',
    'NSF Standard Compliance Requirements',
    'Standard compliance requirements for NSF proposals',
    '[
        {"code": "RCR", "name": "Responsible Conduct of Research", "category": "responsible_conduct", "required": true},
        {"code": "DMP", "name": "Data Management Plan", "category": "data_management", "required": true},
        {"code": "COI", "name": "Conflict of Interest Disclosure", "category": "conflict_of_interest", "required": true},
        {"code": "MENTORING", "name": "Postdoc Mentoring Plan", "category": "other", "required": false}
    ]'::JSONB,
    TRUE
);

-- Sample compliance for a proposal
INSERT INTO proposal_compliance (
    proposal_id, tenant_id, requirement_code, requirement_name, category,
    status, is_required, is_complete, determination
) VALUES
(
    'bbbb1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'RCR',
    'Responsible Conduct of Research Training',
    'responsible_conduct',
    'approved',
    TRUE,
    TRUE,
    'compliant'
),
(
    'bbbb1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'DMP',
    'Data Management Plan',
    'data_management',
    'in_progress',
    TRUE,
    FALSE,
    NULL
),
(
    'bbbb1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'COI',
    'Conflict of Interest Disclosure',
    'conflict_of_interest',
    'approved',
    TRUE,
    TRUE,
    'compliant'
);

-- ============================================================================
-- Demo Training Records
-- ============================================================================
INSERT INTO training_records (
    tenant_id, user_id, training_type, training_name, provider,
    completed_at, expires_at, verified
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'rcr',
    'Responsible Conduct of Research',
    'CITI Program',
    '2025-06-15 10:00:00-05',
    '2028-06-15 10:00:00-05',
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'human_subjects',
    'Human Subjects Research - Social Behavioral',
    'CITI Program',
    '2025-03-20 14:00:00-05',
    '2028-03-20 14:00:00-05',
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'human_subjects',
    'Human Subjects Research - Biomedical',
    'CITI Program',
    '2025-01-10 09:00:00-05',
    '2028-01-10 09:00:00-05',
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'animal_subjects',
    'Working with IACUC',
    'CITI Program',
    '2024-11-05 11:00:00-05',
    '2027-11-05 11:00:00-05',
    TRUE
);

-- ============================================================================
-- Demo COI Disclosures
-- ============================================================================
INSERT INTO coi_disclosures (
    tenant_id, user_id, disclosure_year, status,
    has_significant_financial_interest, financial_interests, certified_at
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    2026,
    'approved',
    FALSE,
    '[]'::JSONB,
    '2026-01-05 10:00:00-05'
),
(
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    2026,
    'approved',
    TRUE,
    '[{"entity": "ClimaTech Solutions", "relationship": "consultant", "amount": "5000-10000", "description": "Consulting on climate modeling software"}]'::JSONB,
    '2026-01-08 14:00:00-05'
);

-- ============================================================================
-- Sample Audit Entries
-- ============================================================================
INSERT INTO audit_logs (
    tenant_id, entity_type, entity_id, entity_name, action, action_category,
    actor_id, actor_name, actor_email, new_values
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'proposals',
    'bbbb1111-1111-1111-1111-111111111111',
    'AI-Enhanced Climate Modeling for Agricultural Sustainability',
    'create',
    'data',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'John Doe',
    'john.doe@demo-university.edu',
    '{"status": "draft", "title": "AI-Enhanced Climate Modeling for Agricultural Sustainability"}'::JSONB
),
(
    '11111111-1111-1111-1111-111111111111',
    'proposals',
    'bbbb3333-3333-3333-3333-333333333333',
    'Wireless Neural Interface for Treatment of Parkinsons Disease',
    'update',
    'workflow',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sarah Administrator',
    'admin@demo-university.edu',
    '{"status": "approved"}'::JSONB
);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE tenants IS 'Seed data includes Demo University and Tech Institute';
COMMENT ON TABLE users IS 'Seed data includes 6 demo users for testing';
COMMENT ON TABLE proposals IS 'Seed data includes 8 diverse proposal examples';
