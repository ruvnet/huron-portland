#!/usr/bin/env bash
# =============================================================================
# create-from-template.sh
# Template script to create your own presentation from the Bangalore format
# =============================================================================

set -euo pipefail

# Configuration - Edit these for your presentation
PRESENTATION_TITLE="${1:-My Agentic Engineering Workshop}"
PRESENTER_NAME="${2:-Your Name}"
EVENT_NAME="${3:-Your Event}"
NUM_SLIDES="${4:-20}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRES_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${PRES_DIR}/custom-${EVENT_NAME// /-}"

echo "================================================================="
echo "  Presentation Template Generator"
echo "  Creating: ${PRESENTATION_TITLE}"
echo "  Presenter: ${PRESENTER_NAME}"
echo "  Event: ${EVENT_NAME}"
echo "  Slides: ${NUM_SLIDES}"
echo "================================================================="
echo ""

# Create directory structure
mkdir -p "${OUTPUT_DIR}"/{slides,adrs,diagrams,scripts,assets}

# Generate README
cat > "${OUTPUT_DIR}/README.md" << EOF
# ${PRESENTATION_TITLE}
## ${EVENT_NAME}

**Presented by**: ${PRESENTER_NAME}
**Slides**: ${NUM_SLIDES}

## Structure

\`\`\`
${OUTPUT_DIR##*/}/
  slides/     # Individual slide markdown files
  adrs/       # One ADR per slide
  diagrams/   # Mermaid and ASCII diagrams
  scripts/    # Generation scripts
  assets/     # Design resources
\`\`\`

## Quick Start

\`\`\`bash
# Generate full presentation
./scripts/generate.sh

# Edit individual slides
code slides/slide-01.md
\`\`\`
EOF

# Generate slide templates
for i in $(seq -w 1 "$NUM_SLIDES"); do
  cat > "${OUTPUT_DIR}/slides/slide-${i}.md" << EOF
# Slide ${i}: [TITLE]
**Duration**: 4 minutes | **ADR**: PRES-${i}

---

## Main Point

> [Key message for this slide]

---

## Content

[Add your content here]

- Point 1
- Point 2
- Point 3

---

## Code Example (if applicable)

\`\`\`
[Add code here]
\`\`\`

---

### [ILLUSTRATION: Description of visual for this slide]
EOF

  # Generate ADR template
  cat > "${OUTPUT_DIR}/adrs/PRES-${i}.md" << EOF
# PRES-${i}: [Slide Title]

## Status
Draft

## Context
[Why does this slide exist? What does the audience need to understand?]

## Decision
[What will be presented and how?]

## Consequences
[What will the audience take away?]

## Duration
4 minutes

## Key Message
[One sentence summary]
EOF
done

# Generate build script
cat > "${OUTPUT_DIR}/scripts/generate.sh" << 'GENEOF'
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRES_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT="${PRES_DIR}/FULL-PRESENTATION.md"

echo "Generating presentation..."

# Header
echo "# ${PRESENTATION_TITLE:-Presentation}" > "$OUTPUT"
echo "" >> "$OUTPUT"

# Concatenate slides
for slide in "${PRES_DIR}"/slides/slide-*.md; do
  [ -f "$slide" ] || continue
  echo "" >> "$OUTPUT"
  echo "---" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  cat "$slide" >> "$OUTPUT"
done

echo "Generated: $OUTPUT"
GENEOF
chmod +x "${OUTPUT_DIR}/scripts/generate.sh"

# Copy design guide from template
if [ -f "${PRES_DIR}/assets/design-guide.md" ]; then
  cp "${PRES_DIR}/assets/design-guide.md" "${OUTPUT_DIR}/assets/"
fi

echo ""
echo "Template created at: ${OUTPUT_DIR}"
echo ""
echo "Next steps:"
echo "  1. Edit slides in ${OUTPUT_DIR}/slides/"
echo "  2. Update ADRs in ${OUTPUT_DIR}/adrs/"
echo "  3. Run ${OUTPUT_DIR}/scripts/generate.sh to build"
echo ""
echo "Slide files to edit:"
for i in $(seq -w 1 "$NUM_SLIDES"); do
  echo "  - slides/slide-${i}.md"
done
