# DASH-005: Mock Data Strategy

## Status
Accepted

## Context
The dashboard must work standalone without a running backend. During hackathon demos, we cannot rely on database connectivity or API availability.

## Decision
Implement a mock data layer controlled by `NEXT_PUBLIC_USE_MOCK_DATA` environment variable (defaults to `true`):

### Mock Dataset
12 proposals covering diverse statuses:
- active, under_review, approved, draft, submitted, rejected
- amendments_requested, reporting, compliance_review
- budget_review, closeout, awaiting_signature

### Data Shape
Each proposal includes:
- Full metadata (title, PI, department, sponsor, amounts, dates)
- Tags for search filtering
- Tenant ID for multi-tenancy demonstration

### API Client Pattern
`lib/api/client.ts` checks `USE_MOCK` flag:
- `true`: Returns data from `mock-data.ts` synchronously
- `false`: Fetches from `NEXT_PUBLIC_API_URL` backend

### Derived Data
Helper functions compute aggregates from mock data:
- `getMockStatusCounts()`: Status distribution
- `getMockDepartmentBudgets()`: Budget allocation by department

## Consequences
- **Positive**: Dashboard works with zero infrastructure
- **Positive**: Consistent demo data across all environments
- **Positive**: Easy to switch to real API by toggling env var
- **Negative**: Mock data may drift from actual schema
- **Mitigated**: Types in `lib/types.ts` serve as contract
