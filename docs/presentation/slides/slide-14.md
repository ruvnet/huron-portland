# Slide 14: Building the Dashboard
**Duration**: 4 minutes | **ADR**: PRES-014

---

## Dashboard Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HCG Grants Dashboard                          [User ▼]    │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  SIDEBAR │   ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│          │   │ Active   │ │ Pending  │ │ Total    │       │
│ Dashboard│   │ Grants   │ │ Reviews  │ │ Budget   │       │
│ Proposals│   │   12     │ │    5     │ │  $2.4M   │       │
│ Budgets  │   └──────────┘ └──────────┘ └──────────┘       │
│ Awards   │                                                  │
│ Search   │   ┌────────────────────────────────────────┐     │
│ Reports  │   │  PROPOSAL STATUS PIPELINE              │     │
│          │   │  Draft(8) → Review(5) → Approved(12)   │     │
│ ──────── │   │  [========][=====][============]       │     │
│ Settings │   └────────────────────────────────────────┘     │
│ Help     │                                                  │
│          │   ┌──────────────────┐ ┌──────────────────┐     │
│          │   │ Recent Activity  │ │ Upcoming          │     │
│          │   │ • P-042 submitted│ │ Deadlines         │     │
│          │   │ • B-018 approved │ │ • NIH R01: 5 days │     │
│          │   │ • A-007 modified │ │ • NSF: 12 days    │     │
│          │   └──────────────────┘ └──────────────────┘     │
│          │                                                  │
│          │   ┌────────────────────────────────────────┐     │
│          │   │  🔍 Semantic Search                    │     │
│          │   │  [ Search proposals by meaning... ]    │     │
│          │   └────────────────────────────────────────┘     │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Dashboard Components

```
src/frontend/
├── app/dashboard/
│   ├── page.tsx              # Dashboard page (server component)
│   └── layout.tsx            # Dashboard layout with sidebar
├── components/
│   ├── dashboard/
│   │   ├── stat-card.tsx     # Metric display card
│   │   ├── pipeline.tsx      # Status pipeline visualization
│   │   ├── activity-feed.tsx # Recent activity list
│   │   ├── deadline-list.tsx # Upcoming deadlines
│   │   └── search-bar.tsx    # Semantic search input
│   └── ui/
│       ├── card.tsx          # shadcn card
│       ├── badge.tsx         # Status badges
│       └── skeleton.tsx      # Loading states
```

---

## Building with Claude Code

```bash
# Tell Claude Code what to build
claude "Build a dashboard page at app/dashboard/page.tsx with:
  - 3 stat cards (active grants, pending reviews, total budget)
  - A proposal status pipeline bar
  - Recent activity feed
  - Upcoming deadlines
  - Semantic search bar using RuVector
  Use shadcn/ui components and TanStack Query for data fetching.
  Follow the existing component patterns in src/frontend/components/"
```

---

## Key Dashboard Patterns

```typescript
// app/dashboard/page.tsx
import { StatCard } from '@/components/dashboard/stat-card';
import { Pipeline } from '@/components/dashboard/pipeline';
import { SearchBar } from '@/components/dashboard/search-bar';

export default async function DashboardPage() {
  // Server-side data fetching
  const stats = await fetchDashboardStats();
  const pipeline = await fetchPipelineData();

  return (
    <div className="grid gap-6 p-6">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active Grants" value={stats.active} />
        <StatCard title="Pending Reviews" value={stats.pending} />
        <StatCard title="Total Budget" value={stats.budget} />
      </div>

      {/* Pipeline */}
      <Pipeline data={pipeline} />

      {/* Search */}
      <SearchBar placeholder="Search proposals by meaning..." />
    </div>
  );
}
```

---

### [ILLUSTRATION: High-fidelity dashboard mockup in dark mode. Top row: three stat cards with icons and numbers. Middle: horizontal pipeline bar with color-coded segments. Bottom-left: activity feed with timestamps. Bottom-right: deadline cards with countdown badges. Search bar with magnifying glass icon. Modern SaaS dashboard aesthetic. Color palette: slate background, blue accents, green/amber/red status colors.]
