# Cognitum Slide Deck — Creative Brief

## Overview

Seven interconnected presentation decks (70+ slides) for Cognitum, an edge AI platform. All decks share a unified dark-mode design system built with React, Tailwind CSS, Framer Motion, and Three.js. The system is designed for fullscreen, landscape-first presentation with touch/keyboard navigation, PDF export, and cross-deck switching.

---

## 1. Color Palette

### Brand Colors

| Token | HSL | Approx Hex | Role |
|-------|-----|------------|------|
| **Primary** (Cyan) | `185 80% 50%` | `#0bbccc` | Headlines, borders, glows, CTAs |
| **Accent** (Green) | `142 70% 50%` | `#2eb85c` | Secondary emphasis, logo dot, badges |

### Surface Colors

| Token | HSL | Role |
|-------|-----|------|
| Background | `220 25% 6%` | Near-black base |
| Card | `220 20% 10%` | Elevated surface |
| Surface Elevated | `220 20% 12%` | Higher-elevation cards |
| Secondary | `220 20% 14%` | Muted dark surface |
| Muted | `220 15% 15%` | Neutral dark fill |
| Border | `220 15% 18%` | Subtle dark border |

### Text Colors

| Token | HSL | Role |
|-------|-----|------|
| Foreground | `210 20% 92%` | Primary text (off-white) |
| Secondary FG | `210 20% 80%` | Slightly dimmer text |
| Muted FG | `215 15% 55%` | Subtitles, descriptions |

### Semantic Colors

| Color | Class Pattern | Usage |
|-------|---------------|-------|
| Red | `text-red-400` / `bg-red-500/5` | Critical threats, problems |
| Orange | `text-orange-400` / `bg-orange-500/5` | Warnings, high severity |
| Yellow | `text-yellow-400` / `bg-yellow-500/5` | Caution, medium severity |
| Green | `text-green-400` / `bg-green-500/5` | Success, financials |
| Pink | `text-pink-400` / `bg-pink-500/5` | Use cases, specialty |
| Amber | `text-amber-400` / `bg-amber-400/10` | Enterprise identity |
| Cyan | `text-cyan-400` / `bg-cyan-400/10` | Technical identity |
| Purple | `#8b5cf6` (Three.js) | Background particles |

### Per-Deck Accent Colors

| Deck | Color |
|------|-------|
| Investor | green-400 |
| v0 Appliance | primary (cyan) |
| Agentic OS | accent (green) |
| Security | red-400 |
| Enterprise | amber-400 |
| Technical | cyan-400 |
| Use Cases | pink-400 |

### Color Transparency Convention

Colors are layered at consistent opacity levels to create depth:
- **5%** (`/5`) — subtle background tint
- **10%** (`/10`) — card/badge background
- **15-20%** (`/15`, `/20`) — borders, stronger tints
- **30%** (`/30`) — emphasized borders, active states

---

## 2. Typography

### Font Families

| Token | Family | Weights | Usage |
|-------|--------|---------|-------|
| `font-display` | **Outfit** (Google Fonts) | 300, 400, 500, 600, 700 | All display and body text |
| `font-mono` | **JetBrains Mono** (Google Fonts) | 400, 500 | Stats, numbers, code, formulas |

### Type Scale

| Usage | Classes | Size |
|-------|---------|------|
| Hero headline | `text-4xl md:text-6xl lg:text-7xl font-bold` | 36/60/72px |
| Section headline | `text-3xl md:text-5xl font-bold` | 30/48px |
| Sub-headline | `text-2xl md:text-4xl font-bold` | 24/36px |
| Hero stat | `text-5xl md:text-6xl font-bold font-mono` | 48/60px |
| Card stat | `text-2xl font-bold font-mono` | 24px |
| Body | `text-lg md:text-xl text-muted-foreground` | 18/20px |
| Description | `text-base text-muted-foreground` | 16px |
| Card heading | `text-sm font-semibold` | 14px |
| Category label | `text-sm font-medium uppercase tracking-wider` | 14px |
| List item / small | `text-xs text-muted-foreground` | 12px |
| Caption | `text-[10px] text-muted-foreground` | 10px |
| Micro label | `text-[9px]` | 9px |

### Gradient Text

```css
.text-gradient-primary {
  background: linear-gradient(135deg, hsl(185 80% 50%) 0%, hsl(185 70% 65%) 100%);
  -webkit-background-clip: text;
  color: transparent;
}
```

Used on all major slide headlines.

---

## 3. Gradients & Shadows

### Gradient Definitions

| Name | Definition | Usage |
|------|-----------|-------|
| Hero | `linear-gradient(135deg, bg 0%, card 50%, dark-blue 100%)` | Page background |
| Card | `linear-gradient(180deg, elevated 0%, surface-overlay 100%)` | `card-elevated` class |
| Glow | `radial-gradient(ellipse, primary/15% 0%, transparent 70%)` | Ambient glow |
| Progress bar | `linear-gradient(to-r, primary, accent, primary)` | Bottom slide progress |
| Text gradient | `linear-gradient(135deg, primary 0%, lighter-cyan 100%)` | Headline text |

### Shadow Definitions

| Name | Value | Usage |
|------|-------|-------|
| Glow Primary | `0 0 60px -10px primary/30%` | Hero elements |
| Glow Accent | `0 0 40px -10px accent/40%` | Secondary emphasis |
| Card | `0 8px 32px -8px near-black/80%` | All `card-elevated` |
| Logo | `drop-shadow(0 0 60px rgba(139,92,246,0.4))` | Purple glow on logo |
| CES Badge | `0 0 24px rgba(59,130,246,0.25)` | Blue glow on badge |

---

## 4. Layout System

### Slide Container

Every slide is a full-viewport container:
```
w-full h-screen flex items-center justify-center overflow-hidden relative
```

### Content Area

```
relative z-10 w-full max-w-5xl mx-auto px-8
```
- Max width: **1024px**
- Horizontal padding: **32px**
- Centered with auto margins

### Grid Patterns

| Pattern | Usage |
|---------|-------|
| `grid-cols-2 gap-4` | Two-column content layouts |
| `grid-cols-3 gap-4` | Three-card rows |
| `grid-cols-4 gap-3` | Four-column spec tiles |
| `grid-cols-2 lg:grid-cols-4` | Responsive 2→4 column |

### Spacing Scale

| Size | Usage |
|------|-------|
| `gap-1` / `mb-0.5` | Micro (inline elements) |
| `gap-1.5` / `mb-2` | List items |
| `gap-2.5` / `mb-3` | Card internals |
| `gap-4` / `p-4` | Grid gaps, card padding |
| `mb-5` / `mb-6` | Section spacing |
| `px-8` | Content horizontal padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-2xl` | 16px | Hero cards |
| `rounded-xl` | 12px | Standard cards |
| `rounded-lg` | 10px | Small cards, icon containers |
| `rounded-full` | 9999px | Badge pills, avatar |

### Landscape Scaling

Special CSS scales the slide area for landscape viewports:
- **≤500px height:** `scale(0.72)`
- **501–650px height:** `scale(0.85)`

---

## 5. Component Library

### `card-elevated`

The universal card component:
```css
background: linear-gradient(180deg, elevated 0%, overlay 100%);
border: 1px solid border/50;
box-shadow: 0 8px 32px -8px near-black/80%;
```
Applied as: `card-elevated rounded-xl p-4 border border-border/30`

### Badge Pill

Status indicators and labels:
```
rounded-full px-3 py-1.5 bg-{color}/10 border border-{color}/20 backdrop-blur-sm
```
Text: `text-xs font-medium text-{color}`

### Icon Container

```
w-7-9 h-7-9 rounded-lg bg-{color}/10 flex items-center justify-center
```
Icon inside: `w-4 h-4 text-{color}`

### Divider

Vertical: `w-px h-5 bg-border/50 mx-1`
Horizontal: `border-t border-border/20`

---

## 6. Animation System

### Framer Motion Variants

Every slide declares three canonical variants:

**Container (stagger):**
```ts
{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
```

**Child (fadeUp):**
```ts
{
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}
```

**Card (scaleIn):**
```ts
{
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}
```

The easing curve `[0.22, 1, 0.36, 1]` (ease-out-expo) is the universal motion signature.

### Slide Transitions

Directional slide with blur:
```
enter:  { x: ±8%, opacity: 0, scale: 0.96, filter: blur(4px) }
center: { x: 0, opacity: 1, scale: 1, filter: blur(0px) }
exit:   { x: ∓8%, opacity: 0, scale: 0.96, filter: blur(4px) }
```
Duration: 0.4s

### CSS Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fade-in` | Opacity 0→1 | 0.8s ease-out |
| `animate-fade-in-up` | Opacity + translateY(20px) | 0.8s ease-out |
| `animate-pulse-slow` | Opacity 0.4↔0.8 | 4s infinite |
| `animate-float` | translateY(0↔-10px) | 6s infinite |

Animation delay utilities: `animation-delay-200`, `animation-delay-400`, `animation-delay-600`

### Micro-Interactions

- Card hover lift: `whileHover={{ y: -4 }}`
- Card hover scale: `whileHover={{ scale: 1.04 }}`
- Animated counters: `useMotionValue` counting from 0 to target over 1.5s
- Progress bars: `initial={{ width: 0 }}` → `animate={{ width: pct }}` with staggered delays
- SVG path drawing: `initial={{ pathLength: 0 }}` → `animate={{ pathLength: 1 }}`
- Background orb breathing: `scale [1, 1.08, 1]` over 6s infinite
- Error shake: `x: [0, -10, 10, -10, 10, 0]` over 0.4s

---

## 7. Three.js Background (`SlideBackground`)

### Stack

- `@react-three/fiber` + `@react-three/drei` + `three`

### Canvas Config

```
camera: position [0, 0, 5], fov 60
dpr: [1, 1.5]
gl: antialias off, alpha true, low-power preference
```

### Scene Elements

| Element | Count | Color | Behavior |
|---------|-------|-------|----------|
| Hyperbolic Field | 500 points | Purple `#8b5cf6` | Poincare disk distribution, slow Z rotation |
| Geodesic Arcs | 4 curves | Cyan `#22d3ee` | 12% opacity, rotating at 0.08 rad/s |
| Inner Ring | 60 points | Purple `#8b5cf6` | r=1.2, rotating 0.2 rad/s, breathing scale |
| Middle Ring | 60 points | Cyan `#22d3ee` | r=1.8, counter-rotating -0.15 rad/s |
| Outer Ring | 60 points | Pink `#f472b6` | r=2.4, rotating 0.1 rad/s |

All use **additive blending** and **no depth write** for layered glow.

### CSS Overlay Stack (above Three.js)

1. **Glow orbs:** 400px primary blur + 300px accent blur
2. **Vertical gradient:** `from-background/60 via-transparent to-background/40`
3. **Horizontal gradient:** `from-background/30 via-transparent to-background/30`
4. **Floating particles:** Three 1–1.5px circles with `animate-float`

---

## 8. Icon System

### Library

**lucide-react** — all icons sourced from this single library.

### Sizing Convention

| Context | Size | Pixels |
|---------|------|--------|
| Hero/feature icon | `w-7` / `w-8` | 28–32px |
| Card icon | `w-5` / `w-6` | 20–24px |
| Inline/badge | `w-3.5` / `w-4` | 14–16px |
| Control button | `w-4` | 16px |
| Micro | `w-3` | 12px |

### Coloring

Icons always receive a semantic `text-{color}` class matching their context. They are typically placed inside a colored container: `rounded-lg bg-{color}/10`.

---

## 9. Interactive Features

### Navigation

| Input | Action |
|-------|--------|
| Arrow Right / Space | Next slide |
| Arrow Left | Previous slide |
| F | Toggle fullscreen |
| Escape | Exit fullscreen |
| Swipe Left (50px threshold) | Next slide |
| Swipe Right | Previous slide |

### Control Panel

Always-visible fixed panel at bottom-right (`fixed bottom-6 right-6 z-50`):
- Previous/Next buttons (44×44px touch targets)
- Slide counter in monospace
- Fullscreen toggle
- PDF download
- Deck switcher dropdown (7 decks)

Container: `bg-background/80 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl`

### Progress Bar

2px gradient bar at bottom of viewport:
```
bg-gradient-to-r from-primary via-accent to-primary
```
Width animates to `(current / total) * 100%` over 0.35s.

### PDF Export

- **html2canvas** captures each slide at 2× scale
- **jsPDF** assembles landscape 1920×1080px pages
- JPEG at 95% quality
- 500ms delay between slide captures for animation settling
- Background color: `#0a0a0f`

### Password Gate

- SHA-256 hash verification with plaintext fallback
- Persisted in `sessionStorage` (`deck_unlocked`)
- Error shake animation on wrong password
- Animated glow orbs in background

### Landscape Prompt

Mobile portrait detection — shows a fullscreen overlay with animated phone rotation suggesting landscape orientation. Dismissable.

### Deck Overview Slide

Shared final slide across all 7 decks — displays all decks as clickable cards with icon, title, description, and "Currently viewing" indicator. Enables seamless navigation between presentations.

---

## 10. Slide Structure Patterns

### Title Slide Formula

1. `SlideBackground` (Three.js + CSS)
2. Logo (`h-16 md:h-24`) with purple glow drop shadow
3. CES 2026 badge with blue glow shadow
4. H1 in `text-gradient-primary` at `text-4xl md:text-6xl lg:text-7xl font-bold`
5. Subtitle in `text-muted-foreground text-lg md:text-xl`
6. Badge pills at bottom

### Content Slide Formula

1. `SlideBackground`
2. Category label: `text-sm font-medium text-{color} uppercase tracking-wider`
3. Headline: `text-3xl md:text-5xl font-bold` with `text-gradient-primary`
4. Description: `text-muted-foreground text-sm mb-6`
5. Content grid: `grid grid-cols-{2-4} gap-{3-4}`
6. Optional bottom highlight card

### Two-Column Data Layout

Left column: Use case items or feature cards
Right column: Key metrics card with stats
Bottom: Full-width tagline in `card-elevated`

---

## 11. Assets

| Asset | Usage |
|-------|-------|
| `cognitum-logo.png` | Every title slide, password gate, contact |
| `ces-2026-honoree.png` | CES badge on title slides |
| `cognitum-agentic-processing-unit.png` | Product imagery |
| `cognitum-appliance.png` | Appliance slides |

Logo styling: `drop-shadow-[0_0_60px_rgba(139,92,246,0.4)]` (purple glow)
CES badge: `shadow-[0_0_24px_rgba(59,130,246,0.25)] brightness-110`

---

## 12. Design Principles

1. **Dark-only** — No light theme. Background is near-black (`hsl(220 25% 6%)`). All design works against dark surfaces.

2. **Depth through transparency** — Cards, badges, and borders use 5–30% opacity over colored backgrounds rather than solid fills, creating a layered glass-morphism effect.

3. **Unified motion language** — Every element enters with the same `[0.22, 1, 0.36, 1]` ease-out-expo curve. Stagger intervals (80–180ms) guide the eye through content hierarchy.

4. **Monospace = data** — All numerical values, statistics, and technical specs use JetBrains Mono. Narrative text uses Outfit. This creates an instant visual distinction between story and evidence.

5. **Color-coded semantics** — Each deck has a consistent accent color. Severity levels (critical/high/medium/low) map to red/orange/yellow/green. This color language carries across borders, backgrounds, icons, and text.

6. **Atmospheric blur** — Background effects use 120–200px blur radii, creating soft ambient lighting rather than visible shapes. Additive blending in Three.js reinforces the ethereal quality.

7. **Touch-first responsive** — 44px minimum touch targets, swipe gestures, landscape detection, and scaling across 5 breakpoints.

8. **`card-elevated` everywhere** — A single card component (gradient background + subtle border + deep shadow) provides visual consistency across all 70+ slides.

9. **Badge pills for metadata** — Status, category, and feature labels consistently use the pill pattern (`rounded-full`, color-tinted background, matching border).

10. **Progressive disclosure** — Content reveals through stagger animations. The eye naturally follows the entrance sequence from headline → subtitle → cards → bottom highlight.

---

## 13. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| Animation | Framer Motion 11 |
| 3D Background | Three.js + @react-three/fiber + @react-three/drei |
| Icons | lucide-react |
| PDF | html2canvas + jsPDF |
| Routing | React Router v6 |
| Fonts | Google Fonts (Outfit, JetBrains Mono) |
| Build | Vite |
| Hosting | Google Cloud Run (cognitum.one) |
