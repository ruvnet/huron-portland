# PRES-019: Testing & Validation

## Status
Accepted

## Context
Testing validates that the agentic-built system works correctly. Playwright E2E tests, integration tests, and validation checklists ensure quality.

## Decision
- Present the testing pyramid (E2E → Integration → Unit → WASM)
- Show Playwright test code for proposal management and search
- Include test execution commands for different modes
- Present the validation checklist (architecture, security, functionality, performance)

## Consequences
- Testing becomes part of the agentic workflow, not an afterthought
- Playwright examples are copy-paste ready
- Validation checklist catches issues before demo

## Duration
3 minutes

## Key Message
The Tester agent writes E2E tests in parallel with the Coder agent. Testing is built-in, not bolted-on.
