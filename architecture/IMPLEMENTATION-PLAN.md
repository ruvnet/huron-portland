# HRS Grants Module - Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for the HRS Grants Module, designed for a 2-hour demo at the Huron Bangalore Hackathon. The system supports research grant management from proposal creation through award closeout.

## Project Overview

| Attribute | Value |
|-----------|-------|
| **System** | HRS Grants Module |
| **Scale** | 5000+ SaaS tenants, 500 concurrent users per tenant |
| **Frontend** | React/Next.js/TypeScript |
| **Backend** | Golang with Clean Architecture |
| **Database** | PostgreSQL with Row-Level Security |
| **Compliance** | FedRamp, NIST, HIPAA, OWASP, SOC2 |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React/Next.js Frontend                            │   │
│  │  (Components, Pages, Hooks, Services, State Management)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API GATEWAY                                    │
│  (Authentication, Rate Limiting, Request Routing)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                            BACKEND SERVICES                                 │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Golang Backend (Clean Architecture)              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │Interfaces│  │Application│  │  Domain  │  │Infrastructure│        │    │
│  │  │  Layer   │  │   Layer   │  │  Layer   │  │    Layer     │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                            DATA LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │  PostgreSQL  │  │    Redis     │  │  Event Bus   │                     │
│  │  (with RLS)  │  │   (Cache)    │  │ (Outbox/MQ)  │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                          EXTERNAL INTEGRATIONS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │  Grants.gov  │  │   Finance    │  │     HR       │                     │
│  │     API      │  │   Systems    │  │   Systems    │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bounded Contexts

### 1. Proposal Management
- **Aggregate Root**: Proposal
- **Key Entities**: TeamMember, StateTransition
- **States**: 21 distinct states
- **Actions**: 26 workflow actions

### 2. Budget Management
- **Aggregate Root**: Budget
- **Key Entities**: BudgetPeriod, PersonnelCost, EquipmentCost
- **Features**: Multi-period budgets, F&A calculations, Cost sharing

### 3. Award Management
- **Aggregate Root**: Award
- **Key Entities**: Modification, Subaward
- **States**: 26 distinct states
- **Features**: Modifications, No-cost extensions, Closeout

### 4. SF424 Form Management
- **Aggregate Root**: FormPackage
- **Key Entities**: SF424Form, Attachment
- **Features**: XML generation, Schema validation, Grants.gov submission

### 5. Compliance Management
- **Aggregate Root**: ComplianceItem
- **Types**: IRB, IACUC, IBC, COI, Export Control
- **Features**: Protocol tracking, Expiration alerts

### 6. Financial Account Management
- **Aggregate Root**: FinancialAccount
- **Key Entities**: ChartString, Transaction
- **Features**: External system integration, Balance tracking

### 7. Identity Management (Shared Kernel)
- **Aggregate Roots**: Person, Organization
- **Key Entities**: ExtendedProfile, Department
- **Features**: ERA Commons ID, ORCID, Biosketch

---

## Implementation Milestones

### Milestone 1: Repository Structure Organization (COMPLETE)

**Status**: Complete

**Deliverables**:
- [x] Architecture directory structure
- [x] Source code directory structure
- [x] ADR directory for decisions
- [x] DDD directory for domain models
- [x] API contracts directory

**Directory Structure**:
```
huron-bangalore/
├── architecture/
│   ├── adrs/           # Architecture Decision Records
│   ├── ddd/            # Domain-Driven Design docs
│   ├── api-contracts/  # OpenAPI specifications
│   ├── diagrams/       # Architecture diagrams
│   └── decisions/      # Decision logs
├── src/
│   ├── backend/
│   │   ├── cmd/        # Application entry points
│   │   └── internal/
│   │       ├── domain/         # Domain layer
│   │       │   ├── proposal/
│   │       │   ├── budget/
│   │       │   ├── award/
│   │       │   ├── sf424/
│   │       │   ├── compliance/
│   │       │   ├── account/
│   │       │   └── identity/
│   │       ├── application/    # Application layer
│   │       ├── infrastructure/ # Infrastructure layer
│   │       └── interfaces/     # Interface layer
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── types/
│       └── public/
└── docs/               # Project documentation
```

---

### Milestone 2: ADR Documents (COMPLETE)

**Status**: Complete

**Deliverables**:

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Clean Architecture with DDD | Complete |
| ADR-002 | Multi-Tenancy with Row-Level Security | Complete |
| ADR-003 | State Machine Implementation | Complete |
| ADR-004 | Event-Driven Architecture | Complete |
| ADR-005 | SF424 Form Generation | Complete |
| ADR-006 | JWT Authentication with RBAC | Complete |
| ADR-007 | RESTful API Design | Complete |

**Key Decisions**:
1. **Architecture**: Clean Architecture with Hexagonal/Ports & Adapters pattern
2. **Multi-tenancy**: Shared database with PostgreSQL RLS for data isolation
3. **Workflow**: Domain-driven state machines with configurable transitions
4. **Events**: Transactional outbox pattern for reliable event publishing
5. **Security**: JWT with short-lived access tokens and role-based permissions

---

### Milestone 3: DDD Bounded Contexts and Aggregates (COMPLETE)

**Status**: Complete

**Deliverables**:
- [x] Bounded context definitions
- [x] Aggregate root specifications
- [x] Value object definitions
- [x] Context mapping (relationships)
- [x] Domain service interfaces

**Documentation**:
- `architecture/ddd/bounded-contexts.md` - Complete bounded context definitions

**Context Relationships**:
| Upstream | Downstream | Pattern |
|----------|------------|---------|
| Proposal | Budget | Partnership |
| Proposal | SF424 | Customer-Supplier |
| Proposal | Compliance | Customer-Supplier |
| Award | Account | Anti-Corruption Layer |
| Identity | All | Shared Kernel |

---

### Milestone 4: Domain Events and Integration Patterns (COMPLETE)

**Status**: Complete

**Deliverables**:
- [x] Event catalog with all domain events
- [x] Event schema definitions
- [x] Integration patterns documentation
- [x] Event handler specifications
- [x] Saga patterns for cross-context operations

**Documentation**:
- `architecture/ddd/domain-events.md` - Complete event catalog

**Event Categories**:
| Context | Event Count | Key Events |
|---------|-------------|------------|
| Proposal | 13 | created, state_changed, submitted, awarded |
| Budget | 6 | created, updated, finalized |
| Award | 9 | created, activated, modified, closed |
| SF424 | 5 | generated, validated, submitted |
| Compliance | 5 | approved, expired, revoked |
| Account | 6 | created, funded, closed |
| Identity | 5 | person.created, org.updated |

---

### Milestone 5: API Contract Structure (COMPLETE)

**Status**: Complete

**Deliverables**:
- [x] OpenAPI 3.0 specification for Proposal API
- [x] Request/Response schemas
- [x] Authentication specification
- [x] Error response format
- [x] Pagination and filtering standards

**Documentation**:
- `architecture/api-contracts/proposal-api.yaml` - Complete OpenAPI spec

**API Endpoints**:
| Resource | Operations | Key Features |
|----------|------------|--------------|
| `/proposals` | CRUD + Actions | Filtering, pagination, search |
| `/proposals/{id}/actions` | GET/POST | State transitions |
| `/proposals/{id}/team` | CRUD | Team member management |
| `/proposals/{id}/history` | GET | State transition history |
| `/proposals/{id}/clone` | POST | Proposal duplication |

---

## Technical Specifications

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| UI Response | <1 second | 95th percentile |
| API Response | <100ms | 95th percentile |
| Concurrent Users | 500/tenant | Per institution |
| Total Tenants | 5000+ | Multi-tenant SaaS |

### Database Schema Conventions

```sql
-- All tenant-scoped tables include:
tenant_id UUID NOT NULL REFERENCES tenants(id),

-- Standard audit columns:
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
created_by UUID REFERENCES persons(id),
updated_by UUID REFERENCES persons(id),
version INTEGER DEFAULT 1,

-- Soft delete:
deleted_at TIMESTAMP WITH TIME ZONE,

-- RLS Policy:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON table_name
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### State Machine Configuration

```go
// Configurable per tenant
type TenantWorkflowConfig struct {
    RequireDeptApproval   bool
    RequireSponsorApproval bool
    AutoSubmitOnApproval  bool
    CustomGuards          map[Action][]Guard
    NotificationRules     []NotificationRule
}
```

### Event Schema

```json
{
  "id": "uuid",
  "type": "proposal.state_changed",
  "version": 1,
  "timestamp": "2026-01-25T10:30:00Z",
  "correlation_id": "uuid",
  "aggregate_type": "proposal",
  "aggregate_id": "uuid",
  "tenant_id": "uuid",
  "actor_id": "uuid",
  "data": { ... }
}
```

---

## Compliance Requirements

### Security Controls

| Framework | Key Controls | Implementation |
|-----------|--------------|----------------|
| FedRamp | AC-2, AC-3, AU-2 | RBAC, RLS, Audit logging |
| HIPAA | Access Control | Department-scoped permissions |
| SOC2 | CC6.1, CC6.2 | Authentication, Authorization |
| OWASP | Top 10 | Input validation, XSS prevention |
| NIST 800-53 | Security controls | Encryption, Access control |

### Audit Requirements

- All state transitions logged
- User actions tracked with timestamps
- Data changes captured with before/after
- Compliance item approvals documented
- Submission attempts recorded

---

## Integration Points

### External Systems

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Grants.gov | REST API | SF424 submission |
| Finance System | ACL Adapter | Account creation |
| HR System | Sync | Person data |
| IRB System | Sync | Protocol status |
| IACUC System | Sync | Protocol status |

### Authentication

| Provider | Protocol | Use Case |
|----------|----------|----------|
| Institutional IdP | SAML 2.0 | SSO for users |
| Internal Auth | JWT | API access |
| Service Accounts | API Keys | System integration |

---

## Demo Scenarios (2-Hour Hackathon)

### Scenario 1: Proposal Creation and Submission
1. Create new proposal with PI and sponsor
2. Build multi-period budget
3. Add team members
4. Submit for department review
5. Approve and submit to Grants.gov

### Scenario 2: Award Management
1. Receive award notification
2. Create award from proposal
3. Set up financial accounts
4. Process modification request
5. Generate progress report

### Scenario 3: Compliance Tracking
1. Add IRB requirement to proposal
2. Link external protocol
3. Track approval status
4. Handle expiration alert
5. Renew compliance item

---

## File Summary

| File | Purpose | Location |
|------|---------|----------|
| ADR-001 | Architecture style decision | `/architecture/adrs/ADR-001-architecture-style.md` |
| ADR-002 | Multi-tenancy strategy | `/architecture/adrs/ADR-002-multi-tenancy-strategy.md` |
| ADR-003 | State machine implementation | `/architecture/adrs/ADR-003-state-machine-implementation.md` |
| ADR-004 | Event-driven architecture | `/architecture/adrs/ADR-004-event-driven-architecture.md` |
| ADR-005 | SF424 form generation | `/architecture/adrs/ADR-005-sf424-form-generation.md` |
| ADR-006 | Authentication/authorization | `/architecture/adrs/ADR-006-authentication-authorization.md` |
| ADR-007 | API design | `/architecture/adrs/ADR-007-api-design.md` |
| Bounded Contexts | DDD context definitions | `/architecture/ddd/bounded-contexts.md` |
| Domain Events | Event catalog | `/architecture/ddd/domain-events.md` |
| Proposal API | OpenAPI specification | `/architecture/api-contracts/proposal-api.yaml` |

---

## Next Steps

1. **Database Schema**: Create PostgreSQL migration scripts
2. **Domain Models**: Implement Golang domain entities
3. **API Handlers**: Build REST endpoints with validation
4. **Frontend Components**: Create React components for proposals
5. **Integration Tests**: Write end-to-end test scenarios

---

## Appendix: Requirements Traceability

| Requirement | ADR/Document | Status |
|-------------|--------------|--------|
| FR-001: Multi-tenant with RLS | ADR-002 | Addressed |
| FR-002: JWT Authentication | ADR-006 | Addressed |
| FR-003: RBAC Authorization | ADR-006 | Addressed |
| FR-015: Change Tracking | ADR-004 | Addressed |
| FR-018: State Machine | ADR-003 | Addressed |
| FR-040: SF424 Management | ADR-005 | Addressed |
| DR-001-023: Data Requirements | Bounded Contexts | Addressed |
| IR-001: Grants.gov Integration | ADR-005 | Addressed |
| UX-001-016: UI Requirements | API Design | Addressed |
