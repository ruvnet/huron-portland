# Presentation Design Guide

## Color Palette

| Name | Hex | Use |
|------|-----|-----|
| Deep Blue | `#1a1a2e` | Primary background, headers |
| Electric Purple | `#6c63ff` | Accent, highlights, links |
| Teal | `#4ecdc4` | Success states, green badges |
| Amber | `#f9a825` | Warning, attention, CTA |
| Coral | `#ff6b6b` | Error states, drift indicators |
| White | `#ffffff` | Text on dark backgrounds |
| Light Gray | `#e0e0e0` | Secondary text, borders |
| Dark Gray | `#2d2d44` | Card backgrounds, code blocks |

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Slide Title | Inter / SF Pro | 36pt | Bold |
| Section Header | Inter / SF Pro | 24pt | Semi-bold |
| Body Text | Inter / SF Pro | 18pt | Regular |
| Code Blocks | JetBrains Mono | 14pt | Regular |
| Table Text | Inter / SF Pro | 16pt | Regular |
| Captions | Inter / SF Pro | 14pt | Light |

## Layout Grid

```
┌─────────────────────────────────────────┐
│  TITLE BAR (slide number + title)       │  60px
├─────────────────────────────────────────┤
│                                         │
│  MAIN CONTENT AREA                      │  ~480px
│  (diagrams, code, tables)               │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  FOOTER (key message + slide count)     │  40px
└─────────────────────────────────────────┘
```

## Slide Templates

### Template A: Title + Diagram
- Top 30%: Title and subtitle
- Bottom 70%: Full-width ASCII/Mermaid diagram

### Template B: Title + Table
- Top 20%: Title
- Middle 60%: Table with header row highlighted
- Bottom 20%: Key takeaway text

### Template C: Title + Code
- Top 15%: Title
- Middle 70%: Code block with syntax highlighting
- Bottom 15%: Annotation/caption

### Template D: Split View
- Left 50%: Concept explanation or diagram
- Right 50%: Code example or comparison

### Template E: Full Diagram
- Top 10%: Title only
- Rest: Full-slide diagram with annotations

## Illustration Style Guide

All illustrations should follow these principles:

1. **Modern flat design** - No gradients or 3D effects unless specified
2. **Dark mode default** - Dark backgrounds (#1a1a2e) with light elements
3. **Tech aesthetic** - Circuit board patterns, node connections, glowing edges
4. **Minimal decoration** - Focus on content, not decoration
5. **Consistent iconography**:
   - Agent: Robot/AI face icon
   - Code: Terminal/brackets icon
   - Database: Cylinder icon
   - Search: Magnifying glass icon
   - Security: Shield/lock icon
   - Performance: Speedometer icon
6. **Animation notes** - Each illustration description includes optional animation hints

## Slide Transition Recommendations

| Transition | When to Use |
|-----------|-------------|
| Fade | Between concept slides |
| Slide Left | Sequential content (step 1 → 2 → 3) |
| None | Code demonstrations |
| Zoom | Highlighting specific details |

## Branding Elements

- **Logo placement**: Top-right corner, 40x40px
- **Slide numbers**: Bottom-right, small (14pt)
- **Attribution**: Bottom-center on last slide
- **QR Code**: Optional, bottom-left on resources slide for repo link
