# PRES-013: Database & Auth with PostgreSQL RLS

## Status
Accepted

## Context
Multi-tenant data isolation is critical for grants management. PostgreSQL Row-Level Security (RLS) provides database-enforced tenant isolation that cannot be bypassed by application bugs.

## Decision
- Show complete RLS setup: enable, create policy, set context, automatic filtering
- Present the request flow: JWT → Auth Middleware → RLS Middleware → PostgreSQL
- Show JWT token structure with role hierarchy
- Include database migration pattern with pgvector and RLS

## Consequences
- Security-first approach established
- RLS eliminates an entire class of data leak bugs
- JWT + RBAC provides granular access control

## Duration
4 minutes

## Key Message
RLS means every query is automatically filtered by tenant. You cannot accidentally leak data.
