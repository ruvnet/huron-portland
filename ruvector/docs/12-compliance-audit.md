# 12 - Huron Grant Compliance & Audit Trail

Track compliance requirements, audit events, and risk assessments using RDF triples and vector search. Models federal grant compliance under 2 CFR 200 (Uniform Guidance).

## Run

```bash
cd ruvector
npm run compliance
```

## What This Example Does

1. Defines 8 federal compliance areas from 2 CFR 200
2. Tracks grant-specific compliance status (compliant, finding, at-risk, pending)
3. Logs 8 audit events with timestamps, auditors, and severity
4. Provides a compliance dashboard with status icons
5. Enables semantic search over audit history
6. Queries compliance data via SPARQL

## Compliance Areas (2 CFR 200)

| Area | Section | Description |
|------|---------|-------------|
| Financial Management | 200.302 | Accounting systems, internal controls |
| Procurement Standards | 200.317-327 | Competitive bidding, sole-source justification |
| Performance Reporting | 200.329 | Quarterly/annual progress reports |
| Record Retention | 200.334 | Document retention policies |
| Single Audit | 200.501 | Audit requirements for $750K+ expenditures |
| Cost Principles | 200.400-475 | Allowable/unallowable costs |
| Subrecipient Monitoring | 200.332 | Oversight of pass-through funds |
| Closeout Procedures | 200.344 | Final reporting and fund liquidation |

## How It Works

### Triple Store for Compliance Requirements

Each compliance requirement is stored as RDF triples:
```javascript
db.add_triple(`<grant/HCG-PDX-001>`, `<hasRequirement>`, `<req/HCG-PDX-001-cfr200-procurement>`);
db.add_triple(`<req/...>`, `<hasStatus>`, `"finding"`);
db.add_triple(`<req/...>`, `<hasNotes>`, `"Missing competitive bid documentation..."`);
```

### Vector-Indexed Audit Events

Audit events are indexed for semantic search:
```javascript
db.insert(textEmbed(eventText), {
  timestamp: "2026-01-20T11:45:00Z",
  grantId: "HCG-PDX-001",
  event: "Procurement documentation gap",
  auditor: "Sarah Chen",
  severity: "high",
});
```

## Output Sections

### Compliance Dashboard
```
[!!] HCG-PDX-001 - Water Infrastructure (EPA)
    Compliant: 3 | At Risk: 1 | Findings: 1 | Pending: 0
    FINDING: Procurement Standards - Missing competitive bid documentation
    AT RISK: Subrecipient Monitoring - Subrecipient late on Q4 report
```

Status icons:
- `[!!]` - Has findings (requires corrective action)
- `[! ]` - Has at-risk items (needs monitoring)
- `[OK]` - Fully compliant

### Audit Timeline
Chronological view of audit events with severity indicators.

### Semantic Audit Search
Search audit history by concept, not just keywords:
```
Search: "procurement bidding contract documentation"
  -> Procurement documentation gap
     Grant: HCG-PDX-001 | Sarah Chen | high
```

### SPARQL Queries
Query compliance status across grants:
```sparql
SELECT ?req ?status WHERE {
  ?req <hasStatus> ?status
}
```

### Risk Summary
```
Total Requirements: 15
Findings: 3
At Risk: 2
Compliance Rate: 67%
```

## Compliance Statuses

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `compliant` | Meets requirements | Continue monitoring |
| `at-risk` | May become non-compliant | Increase oversight |
| `finding` | Non-compliant | Corrective action plan required |
| `pending` | Not yet assessed | Schedule review |

## Real-World Audit Events

The example includes realistic audit scenarios:
- **Cost disallowance** ($2,400 entertainment costs on HUD grant)
- **Procurement gap** ($85K subcontract without competitive bidding)
- **Budget variance** (12.3% labor cost overrun on bridge project)
- **Late reporting** (Q3 report submitted 15 days past deadline)
- **Subrecipient monitoring** (missing quarterly progress report)
- **Corrective action** (procurement manual update + staff training)
- **Single audit prep** (FY2025 audit fieldwork scheduling)

## Production Enhancements

1. **Real-time alerts** - Trigger notifications when status changes to "finding"
2. **Corrective action tracking** - Link findings to corrective action plans with deadlines
3. **Funder-specific requirements** - Different compliance rules per funder (EPA, HUD, FHWA, etc.)
4. **Audit scheduling** - Automated review calendar based on grant type and risk level
5. **Export to compliance reports** - Generate formatted PDF/CSV reports for funders
