# HCG Dashboard

Standalone Next.js 14 dashboard for Huron Grants Consulting Intelligence Platform.

## Quick Start

```bash
cd src/dashboard
npm install
npm run dev
```

Opens on [http://localhost:3002](http://localhost:3002).

## Stack

- **Next.js 14** - App Router
- **HeroUI** - Component library (Tailwind-native)
- **Three.js** - 3D data visualizations via React Three Fiber
- **rvlite** - WASM vector search (with JS fallback)
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **next-themes** - Dark/light mode

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview with KPI cards and status summary |
| `/proposals` | Proposal list with card/table views and filtering |
| `/analytics` | 3D interactive charts (status, budget, timeline) |
| `/search` | Semantic vector search with similarity scores |

## Architecture

This dashboard is **completely standalone** - decoupled from `/src/frontend/`. See `adrs/` for architecture decisions:

- DASH-001: Standalone architecture
- DASH-002: HeroUI component library
- DASH-003: Three.js visualization
- DASH-004: rvlite WASM search
- DASH-005: Mock data strategy

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` | Use mock data (no backend needed) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Backend API URL |
| `NEXT_PUBLIC_WASM_PATH` | `/wasm/rvlite_bg.wasm` | WASM module path |
