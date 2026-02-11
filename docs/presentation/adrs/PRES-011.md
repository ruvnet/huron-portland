# PRES-011: Clean Architecture Go Backend

## Status
Accepted

## Context
The Go backend implements Clean Architecture with 4 layers. Attendees need to understand each layer's responsibility and the dependency rule.

## Decision
- Present the 4 layers with concrete file paths and responsibilities
- Show a domain entity code example (Proposal.Submit())
- Show the server main.go dependency injection pattern
- Emphasize domain layer has ZERO external dependencies

## Consequences
- Attendees understand how to structure Go code for AI agents
- Domain-first thinking becomes the default approach
- Code examples are copy-paste ready for their own projects

## Duration
4 minutes

## Key Message
The domain layer is pure Go with zero imports from HTTP, SQL, or Redis. Dependencies flow inward only.
