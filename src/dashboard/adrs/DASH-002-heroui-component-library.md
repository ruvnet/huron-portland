# DASH-002: HeroUI Component Library

## Status
Accepted

## Context
We need a component library for rapid UI assembly during the hackathon. Candidates:
- **shadcn/ui**: Copy-paste components, high customization, requires setup
- **HeroUI**: Pre-built accessible components, Tailwind-native, dark mode built-in
- **Material UI**: Heavy bundle, different styling paradigm
- **Chakra UI**: Good but adds runtime CSS-in-JS overhead

## Decision
Use HeroUI (`@heroui/react`) because:
- Pre-built components (Card, Table, Chip, Input, Button, Tabs) work out of the box
- Native Tailwind CSS integration via plugin
- Built-in dark mode with `next-themes`
- Framer Motion animations included
- Minimal configuration needed

## Consequences
- **Positive**: Sub-1-hour assembly achievable with pre-built components
- **Positive**: Consistent dark/light theming with zero custom CSS
- **Negative**: Less granular control vs. shadcn copy-paste approach
- **Mitigated**: HeroUI components accept className for Tailwind overrides
