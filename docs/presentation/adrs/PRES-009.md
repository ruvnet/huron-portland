# PRES-009: Repository Structure Walkthrough

## Status
Accepted

## Context
Attendees need to understand the file organization before they start coding. The project follows Clean Architecture with clear separation.

## Decision
- Show full directory tree (3 levels deep) with annotations
- Highlight the Clean Architecture dependency rule with concentric circles
- Provide a "Key Files" table showing which files they'll modify
- Keep the walkthrough high-level (detail comes in slides 11-15)

## Consequences
- Attendees can navigate the codebase independently
- Understanding the structure reduces confusion during the live build
- Dependency rule diagram reinforces ADR-001

## Duration
3 minutes

## Key Message
Dependencies flow inward only. Domain knows nothing about HTTP, SQL, or Redis.
