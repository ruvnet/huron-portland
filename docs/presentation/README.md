# Bangalore Hackathon Presentation
## Agentic Engineering: Building AI-Native Apps in Under 2 Hours

**Presented by**: rUv (Reuven Cohen)
**Event**: Bangalore Hackathon
**Slides**: 23 slides (~60-80 minutes)

## Run the Presentation

```bash
# From repo root:
./start-presentation.sh

# Or directly:
cd docs/presentation
npm install
npm run dev
# Opens at http://localhost:3003
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| Arrow Right / Down | Next slide |
| Arrow Left / Up | Previous slide |
| T | Toggle slide panel |
| F | Fullscreen |

## Slide Structure

| # | Slide | Template |
|---|-------|----------|
| 01 | Welcome: Agentic Engineering | title |
| 02 | About rUv | split |
| 03 | Agentics & Trusted Partners | content |
| 04 | **What We're Building** | title (divider) |
| 05 | The Grants Management System | split |
| 06 | **The Agentic Approach** | title (divider) |
| 07 | What is Agentic Engineering? | split |
| 08 | The Toolchain | diagram |
| 09 | Setup: Codespace + Installation | code |
| 10 | **Architecture & Guardrails** | title (divider) |
| 11 | ADRs & DDD: Guardrails for Agents | table |
| 12 | Repository Structure | code |
| 13 | Database, Auth & Multi-Tenancy | code |
| 14 | **Deep Dive: The Stack** | title (divider) |
| 15 | RuVector Deep Dive | split |
| 16 | Backend: Go Domain + API | code |
| 17 | Frontend: Next.js + WASM | code |
| 18 | Self-Learning & Self-Optimizing | split |
| 19 | **Let's Build** | title (divider) |
| 20 | Live Build: 5-Phase Plan | content |
| 21 | Testing, Validation & Demo | code |
| 22 | Key Takeaways | content |
| 23 | Thank You & Resources | title |

## Tech Stack

- React 18 + TypeScript + Vite
- Three.js (@react-three/fiber + drei) for animated backgrounds
- Framer Motion for slide transitions
- Tailwind CSS with Cognitum design system
