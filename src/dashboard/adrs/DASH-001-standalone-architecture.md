# DASH-001: Standalone Dashboard Architecture

## Status
Accepted

## Context
The hackathon requires a demo-ready dashboard that can be assembled rapidly. The existing `/src/frontend/` Next.js app has its own dependencies and configuration. We need a decoupled dashboard that can run independently for quick iteration.

## Decision
Create `/src/dashboard/` as a completely standalone Next.js 14 application with:
- Own `package.json`, `tsconfig.json`, `tailwind.config.ts`
- Own port (3002) to avoid conflicts with existing frontend (3000)
- Own type definitions (no shared imports from `/src/frontend/`)
- Mock data mode enabled by default for offline demos

## Consequences
- **Positive**: Zero coupling to existing frontend, independent deployment, faster iteration
- **Positive**: Can run `npm install && npm run dev` with no external dependencies
- **Negative**: Some type duplication between `/src/frontend/` and `/src/dashboard/`
- **Mitigated**: Types are intentionally kept minimal; consolidation can happen post-hackathon
