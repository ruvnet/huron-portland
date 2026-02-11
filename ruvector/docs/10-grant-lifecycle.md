# 10 - Huron Grant Lifecycle Tracker

Track grants through their full lifecycle using a Cypher property graph with organizational structure, milestone tracking, and automated alerts.

## Run

```bash
cd ruvector
npm run lifecycle
```

## What This Example Does

1. Defines 8 lifecycle stages with valid transitions (Draft -> Submitted -> Under Review -> Approved/Rejected -> Active -> Closeout -> Completed)
2. Creates organizational structure (Huron teams, reviewers, client)
3. Tracks 6 Portland grants with lifecycle data
4. Generates portfolio dashboard, milestone progress bars, and risk alerts
5. Queries the graph for grant and reviewer data

## Huron Grant Lifecycle Stages

```
Draft ──> Submitted ──> Under Review ──┬──> Approved ──> Active ──> Closeout ──> Completed
                                       │
                                       └──> Rejected ──> Draft (revise & resubmit)
```

## Key Features

### Portfolio Dashboard
- Pipeline summary showing grant counts per stage
- Total portfolio value
- Risk distribution (low/medium/high)

### Milestone Progress
Visual progress bars for each grant:
```
HCG-PDX-001 | [=======-------------] 33% (1/3) | Water Infrastructure
HCG-PDX-005 | [=============-------] 63% (5/8) | Burnside Bridge
HCG-PDX-006 | [====================] 100% (4/4) | Digital Equity
```

### Automated Alerts
The system detects:
- **STALE drafts** - Grants sitting in Draft > 14 days
- **DELAYED reviews** - Grants under review > 30 days
- **AT RISK active grants** - Active > 60 days with < 50% milestones complete
- **HIGH RISK** - Grants flagged for weekly partner review
- **CLOSEOUT reminders** - Verify deliverables and final reporting

## Data Model

### Nodes
| Label | Properties | Count |
|-------|-----------|-------|
| Stage | name | 8 |
| Firm | name | 1 |
| Client | name | 1 |
| Team | name, lead | 3 |
| Reviewer | name, role, specialty | 4 |
| Grant | grantId, title, amount, funder, department, stage, risk, daysInStage, milestones, milestonesComplete | 6 |

### Relationships
| Type | From | To | Description |
|------|------|----|-------------|
| TRANSITIONS_TO | Stage | Stage | Valid lifecycle transitions |
| HAS_TEAM | Firm | Team | Team membership |
| SERVES | Firm | Client | Client relationship |
| REVIEWS | Reviewer | Grant | Review assignments |
| AT_STAGE | Grant | Stage | Current lifecycle position |
| OWNS | Client | Grant | Grant ownership |

## Customization

**Add new stages:**
```javascript
db.cypher(`CREATE (s:Stage {name: 'Negotiation'})`);
db.cypher(`CREATE (approved)-[:TRANSITIONS_TO]->(negotiation)`);
db.cypher(`CREATE (negotiation)-[:TRANSITIONS_TO]->(active)`);
```

**Adjust alert thresholds:**
```javascript
// Change stale draft threshold from 14 to 21 days
if (g.stage === "Draft" && g.daysInStage > 21) { ... }
```

**Add milestone details:**
Extend the grant object with specific milestone names and dates for more detailed tracking.

## Use Cases

- **Grant managers**: Track portfolio status at a glance
- **Partners**: Identify at-risk grants requiring attention
- **Reviewers**: See assigned grants and review workload
- **Clients**: Report on lifecycle progress and milestone completion
