# 13 - Huron Grant Portfolio Analytics

Comprehensive portfolio analysis combining vector search, SQL aggregation patterns, and graph relationships for Huron's Portland grants practice.

## Run

```bash
cd ruvector
npm run portfolio
```

## What This Example Does

1. Tracks 10 Portland grants across 9 departments and 10 funders
2. Uses 3 RvLite databases simultaneously (vector, SQL, graph)
3. Generates executive summary, department/funder breakdowns
4. Visualizes drawdown progress and risk assessment
5. Performs SQL-based financial profile matching
6. Runs semantic search over the portfolio

## Portfolio Dataset

| Grant | Department | Funder | Amount | Status | Drawdown |
|-------|-----------|--------|--------|--------|----------|
| Water Infrastructure | Public Works | EPA | $2.5M | Active | 35% |
| Youth STEM Education | Education | NSF | $450K | Review | 0% |
| Affordable Housing | Housing | HUD | $3.2M | Active | 23% |
| Mental Health Program | Health | SAMHSA | $780K | Draft | 0% |
| Burnside Bridge | Transportation | FHWA | $8.5M | Active | 65% |
| Digital Equity | Technology | NTIA | $1.2M | Closeout | 95% |
| Community Solar | Environment | DOE | $4M | Active | 30% |
| Urban Tree Canopy | Parks | USDA | $350K | Active | 30% |
| TriMet Bus Signal | Transportation | FTA | $2.8M | Active | 40% |
| Small Business Recovery | Economic Dev | EDA | $900K | Active | 60% |

## Three-Database Architecture

This example demonstrates using multiple RvLite instances for different query patterns:

| Database | Dimensions | Purpose |
|----------|-----------|---------|
| `vectorDb` | 256 | Semantic search over grant descriptions |
| `sqlDb` | 4 | Financial profile similarity queries |
| `graphDb` | 4 | Department-funder-grant relationships |

### SQL Financial Vectors

Each grant is encoded as a 4D vector for financial similarity:
```javascript
[
  amount / maxAmount,     // normalized grant size
  drawdown / 100,         // spending progress
  riskScore,              // 0.1 (low), 0.5 (medium), 0.9 (high)
  fte / 5,                // staffing intensity
]
```

This allows queries like "find grants with similar financial profile to Burnside Bridge."

## Output Sections

### Executive Summary
```
Total Grants: 10
Active: 7 | Draft: 1 | Review: 1 | Closeout: 1
Total Awarded: $24,680,000
Total Spent: $11,241,000
Avg Drawdown (Active): 40.4%
Total FTE: 20
```

### Department Breakdown
Table showing grants, awarded amount, spent, and FTE per department.

### Funder Breakdown
Bar chart showing portfolio concentration by federal agency:
```
FHWA     $8,500,000 (34%) #################
DOE      $4,000,000 (16%) ########
HUD      $3,200,000 (13%) #######
```

### Drawdown Analysis
Progress bars for active grants with slow/fast burn flags:
```
HCG-PDX-003 [=====---------------]  23% | $736,000 of $3,200,000 SLOW
HCG-PDX-005 [=============-------]  65% | $5,525,000 of $8,500,000
```

### Risk Assessment
Multi-factor risk scoring:
- `inherent-high` - Manually flagged high risk
- `slow-drawdown` - Active with < 20% spent
- `fast-burn` - Spending ahead of schedule
- `complex-sub-monitoring` - 3+ subrecipients
- `high-value` - Award > $5M

### SQL Financial Matching
Find grants with similar financial profiles using vector distance.

### Semantic Search
Natural language search over grant descriptions.

## Key Analytics Insights

This example answers questions like:
- Which departments manage the most grant funding?
- Which funders represent the greatest portfolio concentration?
- Which grants are spending too slowly or too quickly?
- Which grants carry the highest risk based on multiple factors?
- What grants have similar financial profiles?

## Production Enhancements

1. **Time series tracking** - Store monthly snapshots for trend analysis
2. **Budget forecasting** - Project end-of-grant spending based on burn rate
3. **Cross-portfolio analysis** - Compare Portland portfolio against other Huron city engagements
4. **Automated reporting** - Generate monthly portfolio reports for client steering committee
5. **Anomaly detection** - Flag unusual spending patterns using vector distance from historical norms
