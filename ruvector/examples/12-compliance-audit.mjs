/**
 * 12 - Huron Grant Compliance & Audit Trail
 *
 * Tracks compliance requirements, audit events, and risk
 * assessments using RDF triples and vector search.
 * Models federal grant compliance (2 CFR 200 Uniform Guidance).
 *
 * Run:  npm run compliance
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const DIMS = 256;
const db = new RvLite(new RvLiteConfig(DIMS));

console.log("=== Huron Grant Compliance & Audit System ===\n");

// --- Text embedding ---
function textEmbed(text) {
  const vec = new Float32Array(DIMS);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let c = 0; c < word.length; c++) {
      const h1 = (word.charCodeAt(c) * 31 + w * 7 + c * 13) % DIMS;
      const h2 = (word.charCodeAt(c) * 37 + w * 11 + c * 17) % DIMS;
      vec[h1] += 1.0 / words.length;
      vec[h2] += 0.5 / words.length;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) for (let i = 0; i < DIMS; i++) vec[i] /= norm;
  return vec;
}

function meta(entry) {
  if (entry.metadata instanceof Map) return Object.fromEntries(entry.metadata);
  return entry.metadata || {};
}

// ===== 1. Compliance Requirements (RDF Knowledge Graph) =====
console.log("--- Federal Compliance Requirements (2 CFR 200) ---\n");

const EX = "http://huron.portland.example/";

// Compliance domains
const complianceAreas = [
  { id: "cfr200-financial", name: "Financial Management", section: "2 CFR 200.302" },
  { id: "cfr200-procurement", name: "Procurement Standards", section: "2 CFR 200.317-327" },
  { id: "cfr200-reporting", name: "Performance Reporting", section: "2 CFR 200.329" },
  { id: "cfr200-records", name: "Record Retention", section: "2 CFR 200.334" },
  { id: "cfr200-audit", name: "Single Audit Requirements", section: "2 CFR 200.501" },
  { id: "cfr200-cost", name: "Cost Principles", section: "2 CFR 200.400-475" },
  { id: "cfr200-subrecipient", name: "Subrecipient Monitoring", section: "2 CFR 200.332" },
  { id: "cfr200-closeout", name: "Closeout Procedures", section: "2 CFR 200.344" },
];

for (const area of complianceAreas) {
  db.add_triple(`<${EX}compliance/${area.id}>`, `<${EX}hasName>`, `"${area.name}"`);
  db.add_triple(`<${EX}compliance/${area.id}>`, `<${EX}hasSection>`, `"${area.section}"`);
  db.add_triple(`<${EX}compliance/${area.id}>`, `<${EX}hasType>`, `"federal-requirement"`);
}

console.log(`  Loaded ${complianceAreas.length} compliance areas`);

// ===== 2. Grant-specific compliance requirements =====
const grantCompliance = [
  {
    grantId: "HCG-PDX-001",
    title: "Water Infrastructure",
    funder: "EPA",
    requirements: [
      { area: "cfr200-financial", status: "compliant", lastReview: "2026-01-15", notes: "Quarterly financials submitted on time" },
      { area: "cfr200-procurement", status: "finding", lastReview: "2026-01-20", notes: "Missing competitive bid documentation for $85K subcontract" },
      { area: "cfr200-reporting", status: "compliant", lastReview: "2026-01-10", notes: "SF-425 filed Q4 2025" },
      { area: "cfr200-records", status: "compliant", lastReview: "2025-12-01", notes: "Document retention policy in place" },
      { area: "cfr200-subrecipient", status: "at-risk", lastReview: "2026-01-25", notes: "Subrecipient has not submitted Q4 progress report" },
    ],
  },
  {
    grantId: "HCG-PDX-003",
    title: "Affordable Housing Trust",
    funder: "HUD",
    requirements: [
      { area: "cfr200-financial", status: "compliant", lastReview: "2026-01-18", notes: "Budget on track, 23% expended" },
      { area: "cfr200-cost", status: "finding", lastReview: "2026-01-22", notes: "Unallowable entertainment costs of $2,400 charged to grant" },
      { area: "cfr200-reporting", status: "compliant", lastReview: "2026-01-12", notes: "QPR submitted" },
      { area: "cfr200-audit", status: "pending", lastReview: "2025-11-30", notes: "Single audit due March 2026" },
    ],
  },
  {
    grantId: "HCG-PDX-005",
    title: "Burnside Bridge Retrofit",
    funder: "FHWA",
    requirements: [
      { area: "cfr200-financial", status: "at-risk", lastReview: "2026-01-28", notes: "Budget variance exceeds 10% threshold on labor costs" },
      { area: "cfr200-procurement", status: "compliant", lastReview: "2026-01-05", notes: "All contracts properly competed" },
      { area: "cfr200-reporting", status: "finding", lastReview: "2026-01-30", notes: "Q3 progress report submitted 15 days late" },
      { area: "cfr200-cost", status: "compliant", lastReview: "2026-01-15", notes: "Cost allocation plan approved" },
      { area: "cfr200-records", status: "compliant", lastReview: "2025-12-15", notes: "All engineering drawings archived" },
      { area: "cfr200-subrecipient", status: "compliant", lastReview: "2026-01-20", notes: "3 subrecipients monitored, all current" },
    ],
  },
];

for (const gc of grantCompliance) {
  db.add_triple(`<${EX}grant/${gc.grantId}>`, `<${EX}hasTitle>`, `"${gc.title}"`);
  db.add_triple(`<${EX}grant/${gc.grantId}>`, `<${EX}hasFunder>`, `"${gc.funder}"`);

  for (const req of gc.requirements) {
    const reqId = `${gc.grantId}-${req.area}`;
    db.add_triple(`<${EX}grant/${gc.grantId}>`, `<${EX}hasRequirement>`, `<${EX}req/${reqId}>`);
    db.add_triple(`<${EX}req/${reqId}>`, `<${EX}hasArea>`, `<${EX}compliance/${req.area}>`);
    db.add_triple(`<${EX}req/${reqId}>`, `<${EX}hasStatus>`, `"${req.status}"`);
    db.add_triple(`<${EX}req/${reqId}>`, `<${EX}hasLastReview>`, `"${req.lastReview}"`);
    db.add_triple(`<${EX}req/${reqId}>`, `<${EX}hasNotes>`, `"${req.notes}"`);
  }
}

console.log(`  Total triples: ${db.triple_count()}`);

// ===== 3. Compliance Dashboard =====
console.log("\n=== Compliance Dashboard ===\n");

for (const gc of grantCompliance) {
  const findings = gc.requirements.filter(r => r.status === "finding");
  const atRisk = gc.requirements.filter(r => r.status === "at-risk");
  const compliant = gc.requirements.filter(r => r.status === "compliant");
  const pending = gc.requirements.filter(r => r.status === "pending");

  const statusIcon =
    findings.length > 0 ? "!!" :
    atRisk.length > 0 ? "! " :
    "OK";

  console.log(`[${statusIcon}] ${gc.grantId} - ${gc.title} (${gc.funder})`);
  console.log(`    Compliant: ${compliant.length} | At Risk: ${atRisk.length} | Findings: ${findings.length} | Pending: ${pending.length}`);

  for (const f of findings) {
    const areaName = complianceAreas.find(a => a.id === f.area)?.name || f.area;
    console.log(`    FINDING: ${areaName} - ${f.notes}`);
  }
  for (const r of atRisk) {
    const areaName = complianceAreas.find(a => a.id === r.area)?.name || r.area;
    console.log(`    AT RISK: ${areaName} - ${r.notes}`);
  }
  console.log();
}

// ===== 4. Audit Event Log (Vector-Indexed) =====
console.log("=== Audit Event Log ===\n");

const auditEvents = [
  {
    timestamp: "2026-01-05T09:15:00Z",
    grantId: "HCG-PDX-001",
    event: "Quarterly financial review completed",
    auditor: "Marcus Rivera",
    severity: "info",
    detail: "Reviewed Q4 2025 SF-425 financial report. All expenditures properly documented. Indirect cost rate applied correctly at 22.5% per negotiated rate agreement.",
  },
  {
    timestamp: "2026-01-12T14:30:00Z",
    grantId: "HCG-PDX-003",
    event: "Cost disallowance identified",
    auditor: "Marcus Rivera",
    severity: "high",
    detail: "Identified $2,400 in entertainment and social event costs charged to HUD grant. These costs are explicitly unallowable under 2 CFR 200.438. Corrective action required: journal entry to remove costs and charge to unrestricted funds.",
  },
  {
    timestamp: "2026-01-15T10:00:00Z",
    grantId: "HCG-PDX-005",
    event: "Budget variance analysis",
    auditor: "Priya Patel",
    severity: "medium",
    detail: "Labor costs exceed budget by 12.3% ($185K over). Root cause: additional engineering inspections required by ODOT. Budget modification request drafted for FHWA approval. Current burn rate suggests potential shortfall of $340K by project end.",
  },
  {
    timestamp: "2026-01-20T11:45:00Z",
    grantId: "HCG-PDX-001",
    event: "Procurement documentation gap",
    auditor: "Sarah Chen",
    severity: "high",
    detail: "Subcontract for environmental testing ($85K) lacks required competitive bidding documentation. Micro-purchase threshold is $10K. Vendor was sole-sourced without documented justification. Corrective action: obtain retroactive sole-source justification or re-compete.",
  },
  {
    timestamp: "2026-01-25T16:00:00Z",
    grantId: "HCG-PDX-001",
    event: "Subrecipient monitoring alert",
    auditor: "David Kim",
    severity: "medium",
    detail: "Portland Water Bureau subrecipient has not submitted Q4 2025 progress report. 25 days past due. Risk of grant condition violation. Sent formal notification letter with 10-day response deadline.",
  },
  {
    timestamp: "2026-01-28T13:20:00Z",
    grantId: "HCG-PDX-005",
    event: "Late reporting finding",
    auditor: "Marcus Rivera",
    severity: "medium",
    detail: "Q3 2025 performance report for FHWA bridge project submitted 15 days after deadline. Documented as reporting finding. Implemented calendar reminders and 7-day advance notification to prevent recurrence.",
  },
  {
    timestamp: "2026-02-01T09:00:00Z",
    grantId: "HCG-PDX-003",
    event: "Single audit preparation kickoff",
    auditor: "Priya Patel",
    severity: "info",
    detail: "Initiated single audit preparation for FY2025. Total federal expenditures exceed $750K threshold. Engaged external audit firm Peterson & Associates. Audit fieldwork scheduled for March 10-21, 2026.",
  },
  {
    timestamp: "2026-02-05T15:30:00Z",
    grantId: "HCG-PDX-001",
    event: "Corrective action plan submitted",
    auditor: "Sarah Chen",
    severity: "info",
    detail: "Submitted corrective action plan for procurement finding. Includes: 1) Retroactive sole-source justification with market research, 2) Updated procurement manual, 3) Staff training on procurement thresholds scheduled Feb 15.",
  },
];

// Index audit events for semantic search
for (const evt of auditEvents) {
  const text = `${evt.event} ${evt.detail} ${evt.grantId} ${evt.auditor} ${evt.severity}`;
  db.insert(textEmbed(text), {
    timestamp: evt.timestamp,
    grantId: evt.grantId,
    event: evt.event,
    auditor: evt.auditor,
    severity: evt.severity,
  });
}
console.log(`Indexed ${auditEvents.length} audit events.\n`);

// Timeline view
console.log("--- Recent Audit Timeline ---\n");
const sorted = [...auditEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
for (const evt of sorted.slice(0, 6)) {
  const date = evt.timestamp.slice(0, 10);
  const sevIcon = evt.severity === "high" ? "!!" : evt.severity === "medium" ? "! " : "  ";
  console.log(`  ${date} [${sevIcon}] ${evt.grantId} | ${evt.event}`);
  console.log(`           Auditor: ${evt.auditor}`);
}

// ===== 5. Semantic Search over Audit Events =====
console.log("\n=== Semantic Audit Search ===\n");

const auditQueries = [
  "procurement bidding contract documentation",
  "budget overrun cost variance financial",
  "subrecipient monitoring reporting deadline",
  "corrective action plan remediation",
];

for (const q of auditQueries) {
  console.log(`Search: "${q}"`);
  const results = db.search(textEmbed(q), 2);
  for (const r of results) {
    const m = meta(r);
    console.log(
      `  -> ${m.event}` +
      `\n     Grant: ${m.grantId} | ${m.auditor} | ${m.severity} | ${m.timestamp?.slice(0, 10)}`
    );
  }
  console.log();
}

// ===== 6. SPARQL: Query compliance status =====
console.log("=== SPARQL Compliance Queries ===\n");

// All grant titles
const grantTitles = db.sparql(`
  SELECT ?grant ?title WHERE {
    ?grant <${EX}hasTitle> ?title
  }
`);
console.log("Grants tracked:");
for (const row of grantTitles.bindings || []) {
  console.log(`  ${row.grant?.value?.split("/").pop()} - ${row.title?.value}`);
}

// All findings
console.log("\nCompliance findings (from triples):");
const findingStatuses = db.sparql(`
  SELECT ?req ?status WHERE {
    ?req <${EX}hasStatus> ?status
  }
`);
for (const row of findingStatuses.bindings || []) {
  const status = row.status?.value;
  if (status === "finding" || status === "at-risk") {
    const reqId = row.req?.value?.split("/").pop();
    console.log(`  ${reqId}: ${status}`);
  }
}

// ===== 7. Risk Summary =====
console.log("\n=== Risk Summary ===\n");

let totalFindings = 0;
let totalAtRisk = 0;
let totalReqs = 0;

for (const gc of grantCompliance) {
  for (const req of gc.requirements) {
    totalReqs++;
    if (req.status === "finding") totalFindings++;
    if (req.status === "at-risk") totalAtRisk++;
  }
}

const complianceRate = Math.round(((totalReqs - totalFindings - totalAtRisk) / totalReqs) * 100);
console.log(`  Total Requirements: ${totalReqs}`);
console.log(`  Findings: ${totalFindings}`);
console.log(`  At Risk: ${totalAtRisk}`);
console.log(`  Compliance Rate: ${complianceRate}%`);
console.log(`  Audit Events: ${auditEvents.length}`);
console.log(`  Triple Store: ${db.triple_count()} triples`);

console.log("\nDone.");
