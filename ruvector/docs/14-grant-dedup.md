# 14 - Huron Grant Deduplication & Overlap Detection

Uses vector similarity to detect duplicate or overlapping grant proposals across departments, preventing double-dipping and identifying coordination opportunities.

## Run

```bash
cd ruvector
npm run dedup
```

## What This Example Does

1. Indexes 12 grant submissions from multiple Portland departments
2. Performs pairwise similarity analysis across all submissions
3. Flags duplicates (high similarity) and overlaps (moderate similarity)
4. Generates a deduplication summary with risk metrics
5. Identifies cross-department coordination opportunities

## Why Deduplication Matters

In large municipal grant operations, multiple departments often submit overlapping proposals:
- **Same funder, same scope** - Both Environment and Public Works apply to EPA for water monitoring
- **Same population, different funder** - Education and Technology both target digital equity for underserved youth
- **Same activities, different framing** - Health submits two nearly identical crisis response proposals to different agencies

These overlaps can:
- Trigger funder red flags (double-dipping)
- Waste preparation effort
- Miss opportunities for stronger joint proposals

## How It Works

### 1. Embed All Submissions

Each submission is converted to a 256-dimensional vector from its title, description, department, and funder:

```javascript
db.insert_with_id(sub.id, textEmbed(text), {
  dept: sub.dept,
  funder: sub.funder,
  title: sub.title,
  amount: String(sub.amount),
});
```

### 2. Pairwise Comparison

For each submission, search for similar submissions and filter by threshold:

```javascript
const results = db.search(textEmbed(text), 4);
for (const r of results) {
  if (r.id === sub.id) continue;          // skip self
  if (r.score < OVERLAP_THRESHOLD) continue; // below threshold
  // Flag as overlap or duplicate
}
```

### 3. Threshold Classification

| Score Range | Classification | Action |
|-------------|---------------|--------|
| >= 0.50 | LIKELY DUPLICATE | Merge or designate lead department |
| 0.40 - 0.50 | OVERLAP DETECTED | Differentiate scope or coordinate |
| < 0.40 | No overlap | No action needed |

*Note: With real ML embeddings, typical thresholds would be 0.85+ for duplicates and 0.65+ for overlaps.*

## Test Dataset

The example includes intentionally overlapping submissions:

**Overlapping Pair 1: Water Quality**
- SUB-003: Environment - "Willamette River Water Quality Sensors" (EPA, $420K)
- SUB-004: Public Works - "Water Quality Monitoring Infrastructure" (EPA, $380K)

**Overlapping Pair 2: Digital Equity**
- SUB-005: Technology - "Portland Digital Equity Initiative" (NTIA, $1.5M)
- SUB-006: Education - "Digital Access for Portland Students" (NTIA, $650K)

**Overlapping Pair 3: Urban Greening**
- SUB-007: Parks - "Urban Forest Restoration Program" (USDA, $480K)
- SUB-008: Environment - "Portland Tree Canopy and Climate Resilience" (USDA, $520K)

**Near-Duplicate: Mental Health (Same Department)**
- SUB-011: Health - "Community Crisis Response Team" (SAMHSA, $780K)
- SUB-012: Health - "Mental Health Emergency Response Program" (HRSA, $640K)

## Output Sections

### Overlap Detection
```
[!!] LIKELY DUPLICATE (similarity: 0.5123)
    A: SUB-011 | Health    | Community Crisis Response Team
    B: SUB-012 | Health    | Mental Health Emergency Response Program
    ACTION: Same department - merge into single stronger proposal
```

### Summary Report
```
Total Submissions: 12
Likely Duplicates: 2
Partial Overlaps: 8
Clean (no overlap): 4
```

### Coordination Opportunities
Cross-department overlaps that could become joint proposals:
```
Environment + Public Works
  "Water Quality Sensors" + "Water Quality Monitoring"
  Combined value: $800,000
  Strategy: Joint proposal with Environment as lead, Public Works as co-PI
```

## Recommended Actions by Overlap Type

| Scenario | Action |
|----------|--------|
| Same dept, same funder | Merge into one stronger proposal |
| Same dept, diff funder | Differentiate scope, submit both |
| Diff dept, same funder | Designate lead department, co-PI structure |
| Diff dept, diff funder | Submit both with complementary framing |

## Production Enhancements

1. **Real embeddings** - Use ML models for much higher accuracy overlap detection
2. **Funder rules engine** - Incorporate funder-specific double-dipping policies
3. **Historical overlap database** - Track which past overlaps caused problems
4. **Automated alerts** - Notify grants team when new submission resembles existing one
5. **Merge assistant** - AI-powered tool to combine overlapping proposals into joint submissions
6. **Dashboard integration** - Visual network graph showing submission relationships
