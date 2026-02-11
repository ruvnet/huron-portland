# PRES-015: Middleware & API Layer

## Status
Accepted

## Context
The middleware stack handles cross-cutting concerns (CORS, rate limiting, auth, RLS, logging, security). The API follows RESTful conventions with JSON:API-inspired responses.

## Decision
- Show the middleware stack as a vertical pipeline with 6 layers
- Present API endpoint table for proposals, budgets, and search
- Show JSON response format
- Include Go middleware implementation for RLS tenant context

## Consequences
- Clear understanding of request lifecycle
- API design is consistent and well-documented
- Middleware order is important and explicitly defined

## Duration
3 minutes

## Key Message
6 middleware layers process every request: CORS, rate limit, auth, tenant, logging, security.
