# 11 - Huron Grant Matching & Recommendation Engine

Uses vector similarity to match funding opportunities with Portland department capabilities and past grant history.

## Run

```bash
cd ruvector
npm run matching
```

## What This Example Does

1. Builds capability profiles for 7 Portland departments
2. Indexes 8 federal funding opportunities with deadlines
3. Matches departments to their best-fit opportunities (forward match)
4. Identifies the best department for each opportunity (reverse match)
5. Generates a portfolio fit summary with pipeline values

## How It Works

### Department Profiles

Each department is encoded as a vector combining:
- **Capabilities** - Keywords describing their expertise
- **Past grants** - Names of previously awarded grants
- **Capacity level** - High, medium, or low

```javascript
const dept = {
  name: "Public Works",
  capabilities: "water infrastructure roads bridges stormwater sewer ...",
  pastGrants: ["EPA Water Quality", "FHWA Bridge Repair", ...],
  budget: 12000000,
  capacity: "high",
};
```

### Funding Opportunities

Each opportunity is indexed with:
- Title, funder, amount, deadline
- Full description of the funding program
- Keywords for matching

### Matching Algorithm

1. **Embed** department profile text into a 256-dimensional vector
2. **Embed** each opportunity description into the same vector space
3. **Search** for nearest neighbors using cosine similarity
4. **Rank** matches by similarity score

## Output Sections

### Forward Match: Department -> Opportunities
For each department, find the top 3 matching funding opportunities:
```
Public Works Department (high capacity):
  1. [GOOD] FEMA Building Resilient Infrastructure
     Funder: FEMA | $10,000,000 | Deadline: 2026-03-15
     Match Score: 0.3445
```

### Reverse Match: Opportunity -> Best Department
For each opportunity, find the best-fit department:
```
FO-2026-003 HUD Choice Neighborhoods Implementation
  Best Fit: Housing (0.3379)
  Recommendation: EVALUATE
```

### Portfolio Fit Summary
Aggregate view of pipeline value per department:
```
Public Works     | 6 strong matches | Pipeline: $52,500,000
Education        | 5 strong matches | Pipeline: $68,500,000
```

## Key Concepts

### Bidirectional Matching
- **Forward**: "What opportunities fit this department?"
- **Reverse**: "Which department should pursue this opportunity?"

This prevents grants from falling through cracks and avoids multiple departments pursuing the same opportunity without coordination.

### Match Score Interpretation

| Score Range | Label | Action |
|-------------|-------|--------|
| > 0.50 | STRONG | Definitely pursue |
| 0.35 - 0.50 | GOOD | High-priority evaluation |
| < 0.35 | MODERATE | Review if capacity allows |

*Note: Hash-based embeddings produce lower scores than ML models. With real embeddings (e.g., OpenAI, ONNX), scores above 0.7 indicate strong matches.*

## Production Enhancements

1. **Real embeddings** - Replace hash function with `text-embedding-3-small` for better semantic matching
2. **Historical win rates** - Weight departments by their past success rate with specific funders
3. **Capacity constraints** - Filter out departments with insufficient FTE or budget headroom
4. **Deadline prioritization** - Sort results by upcoming deadlines
5. **Funder relationship scoring** - Boost matches where department has existing funder relationship
