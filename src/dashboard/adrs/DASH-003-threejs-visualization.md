# DASH-003: Three.js 3D Visualization

## Status
Accepted

## Context
The hackathon demo needs visually impressive data visualizations. Options:
- **Chart.js / Recharts**: 2D charts, familiar but common
- **D3.js**: Powerful but steep learning curve, verbose
- **Three.js + React Three Fiber**: 3D interactive charts, high wow factor
- **Plotly**: Feature-rich but large bundle

## Decision
Use Three.js via `@react-three/fiber` and `@react-three/drei` for 3D charts:
- 3D bar charts for proposal status distribution
- 3D pie/donut charts for department budget allocation
- 3D timeline for proposal submission history
- Interactive orbit controls for audience engagement

## Implementation
- `three-canvas-wrapper.tsx` uses `next/dynamic` with `ssr: false` to avoid hydration issues
- Charts use `useFrame` for subtle rotation animations
- `OrbitControls` from drei allows mouse interaction
- Metalness/roughness materials for visual depth

## Consequences
- **Positive**: Visually differentiated from standard dashboards
- **Positive**: Interactive 3D creates engagement during live demos
- **Negative**: Larger bundle size (~200KB for Three.js)
- **Mitigated**: Dynamic imports ensure Three.js only loads on analytics page
