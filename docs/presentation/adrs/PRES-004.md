# PRES-004: Installing Claude Flow & RuVector

## Status
Accepted

## Context
Claude Flow and RuVector require separate installation steps. Claude Flow is npm-based while RuVector has multiple components (Rust, WASM, Docker).

## Decision
- Show Claude Flow installation via npx (zero-install) as primary method
- Present RuVector components with their installation paths (cargo, npm, Docker)
- Include docker-compose.yml excerpt showing RuVector service configuration
- Provide a quick verification checklist

## Consequences
- npx approach eliminates installation friction for Claude Flow
- Docker handles RuVector complexity for the hackathon
- Cargo install is optional (only for custom rvlite builds)

## Duration
3 minutes

## Key Message
npx for Claude Flow, Docker for RuVector -- zero friction setup.
