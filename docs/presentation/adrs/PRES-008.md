# PRES-008: How ADR/DDD Prevents Agent Drift

## Status
Accepted

## Context
Agent drift is the primary risk of agentic engineering. Without guardrails, AI agents gradually produce inconsistent, conflicting code over multiple iterations. This is the most critical concept in the presentation.

## Decision
- Define agent drift with a visual comparison (with vs without guardrails)
- Categorize 3 drift types: Structural, Behavioral, Domain
- Present the 4-layer anti-drift architecture (CLAUDE.md → ADRs → DDD → Swarm)
- Show a concrete example: adding a feature with and without guardrails
- Introduce the memory feedback loop for continuous improvement

## Consequences
- This is the conceptual core of the presentation
- Attendees leave understanding WHY architectural discipline matters more with AI
- Provides the motivation for writing ADRs before coding

## Duration
4 minutes

## Key Message
Without guardrails, iteration 20 is chaos. With ADR/DDD, iteration 20 is still aligned.
