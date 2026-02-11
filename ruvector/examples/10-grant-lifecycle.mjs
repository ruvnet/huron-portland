/**
 * 10 - Huron Grant Lifecycle Tracker
 *
 * Tracks grants through their full lifecycle using a Cypher
 * property graph: Draft -> Submitted -> Under Review ->
 * Approved/Rejected -> Active -> Closeout -> Completed.
 *
 * Models real Huron workflows: status transitions, reviewer
 * assignments, milestone tracking, and timeline compliance.
 *
 * Run:  npm run lifecycle
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const db = new RvLite(new RvLiteConfig(4));

console.log("=== Huron Grant Lifecycle Tracker ===\n");

// ===== 1. Define the lifecycle stages =====
const stages = [
  "Draft", "Submitted", "UnderReview",
  "Approved", "Rejected",
  "Active", "Closeout", "Completed",
];

for (const s of stages) {
  db.cypher(`CREATE (s:Stage {name: '${s}'})`);
}

// Valid transitions
const transitions = [
  ["Draft", "Submitted"],
  ["Submitted", "UnderReview"],
  ["UnderReview", "Approved"],
  ["UnderReview", "Rejected"],
  ["Rejected", "Draft"],           // can revise and resubmit
  ["Approved", "Active"],
  ["Active", "Closeout"],
  ["Closeout", "Completed"],
];

for (const [from, to] of transitions) {
  db.cypher(`CREATE (${from.toLowerCase()})-[:TRANSITIONS_TO]->(${to.toLowerCase()})`);
}

console.log(`Lifecycle: ${stages.length} stages, ${transitions.length} transitions`);

// ===== 2. Create organizational structure =====
const orgs = [
  { id: "huron", label: "Firm", name: "Huron Consulting Group" },
  { id: "client", label: "Client", name: "City of Portland" },
];

const teams = [
  { id: "team-grants", name: "Grants Management", lead: "Sarah Chen" },
  { id: "team-compliance", name: "Compliance & Audit", lead: "Marcus Rivera" },
  { id: "team-finance", name: "Financial Advisory", lead: "Priya Patel" },
];

const reviewers = [
  { id: "rev-chen", name: "Sarah Chen", role: "Senior Manager", specialty: "Federal grants" },
  { id: "rev-rivera", name: "Marcus Rivera", role: "Director", specialty: "Compliance" },
  { id: "rev-patel", name: "Priya Patel", role: "Partner", specialty: "Municipal finance" },
  { id: "rev-kim", name: "David Kim", role: "Analyst", specialty: "Data analytics" },
];

for (const o of orgs) {
  db.cypher(`CREATE (o:${o.label} {name: '${o.name}'})`);
}
for (const t of teams) {
  db.cypher(`CREATE (t:Team {name: '${t.name}', lead: '${t.lead}'})`);
}
for (const r of reviewers) {
  db.cypher(`CREATE (r:Reviewer {name: '${r.name}', role: '${r.role}', specialty: '${r.specialty}'})`);
}

// Team relationships
db.cypher(`CREATE (huron)-[:HAS_TEAM]->(team_grants)`);
db.cypher(`CREATE (huron)-[:HAS_TEAM]->(team_compliance)`);
db.cypher(`CREATE (huron)-[:HAS_TEAM]->(team_finance)`);
db.cypher(`CREATE (huron)-[:SERVES]->(client)`);

console.log(`Org: ${orgs.length} orgs, ${teams.length} teams, ${reviewers.length} reviewers`);

// ===== 3. Create grants with lifecycle data =====
const grants = [
  {
    id: "HCG-PDX-001",
    title: "Water Infrastructure Modernization",
    amount: 2500000,
    funder: "EPA",
    department: "Public Works",
    stage: "Active",
    risk: "low",
    daysInStage: 45,
    milestones: 3,
    milestonesComplete: 1,
  },
  {
    id: "HCG-PDX-002",
    title: "Youth STEM Education Initiative",
    amount: 450000,
    funder: "NSF",
    department: "Education",
    stage: "UnderReview",
    risk: "medium",
    daysInStage: 12,
    milestones: 4,
    milestonesComplete: 0,
  },
  {
    id: "HCG-PDX-003",
    title: "Affordable Housing Trust Fund",
    amount: 3200000,
    funder: "HUD",
    department: "Housing",
    stage: "Approved",
    risk: "low",
    daysInStage: 5,
    milestones: 6,
    milestonesComplete: 0,
  },
  {
    id: "HCG-PDX-004",
    title: "Community Mental Health Program",
    amount: 780000,
    funder: "SAMHSA",
    department: "Health",
    stage: "Draft",
    risk: "high",
    daysInStage: 30,
    milestones: 5,
    milestonesComplete: 0,
  },
  {
    id: "HCG-PDX-005",
    title: "Burnside Bridge Seismic Retrofit",
    amount: 8500000,
    funder: "FHWA",
    department: "Transportation",
    stage: "Active",
    risk: "medium",
    daysInStage: 90,
    milestones: 8,
    milestonesComplete: 5,
  },
  {
    id: "HCG-PDX-006",
    title: "Digital Equity Broadband Access",
    amount: 1200000,
    funder: "NTIA",
    department: "Technology",
    stage: "Closeout",
    risk: "low",
    daysInStage: 15,
    milestones: 4,
    milestonesComplete: 4,
  },
];

for (const g of grants) {
  db.cypher(
    `CREATE (g:Grant {` +
    `grantId: '${g.id}', ` +
    `title: '${g.title}', ` +
    `amount: '${g.amount}', ` +
    `funder: '${g.funder}', ` +
    `department: '${g.department}', ` +
    `stage: '${g.stage}', ` +
    `risk: '${g.risk}', ` +
    `daysInStage: '${g.daysInStage}', ` +
    `milestones: '${g.milestones}', ` +
    `milestonesComplete: '${g.milestonesComplete}'` +
    `})`
  );
}

// Assign reviewers to grants
db.cypher(`CREATE (rev_chen)-[:REVIEWS]->(hcg_pdx_001)`);
db.cypher(`CREATE (rev_patel)-[:REVIEWS]->(hcg_pdx_001)`);
db.cypher(`CREATE (rev_chen)-[:REVIEWS]->(hcg_pdx_002)`);
db.cypher(`CREATE (rev_rivera)-[:REVIEWS]->(hcg_pdx_003)`);
db.cypher(`CREATE (rev_kim)-[:REVIEWS]->(hcg_pdx_004)`);
db.cypher(`CREATE (rev_patel)-[:REVIEWS]->(hcg_pdx_005)`);
db.cypher(`CREATE (rev_rivera)-[:REVIEWS]->(hcg_pdx_005)`);
db.cypher(`CREATE (rev_chen)-[:REVIEWS]->(hcg_pdx_006)`);

// Grant-to-stage relationships
for (const g of grants) {
  db.cypher(`CREATE (${g.id.replace(/-/g, "_").toLowerCase()})-[:AT_STAGE]->(${g.stage.toLowerCase()})`);
}

// Grant-to-client
for (const g of grants) {
  db.cypher(`CREATE (client)-[:OWNS]->(${g.id.replace(/-/g, "_").toLowerCase()})`);
}

console.log(`Grants: ${grants.length} tracked\n`);

// ===== 4. Portfolio Dashboard =====
console.log("=== Portfolio Dashboard ===\n");

// Pipeline summary
const pipeline = {};
for (const g of grants) {
  pipeline[g.stage] = (pipeline[g.stage] || 0) + 1;
}
console.log("Pipeline:");
for (const [stage, count] of Object.entries(pipeline)) {
  const bar = "#".repeat(count * 5);
  console.log(`  ${stage.padEnd(14)} ${bar} (${count})`);
}

// Total portfolio value
const totalValue = grants.reduce((sum, g) => sum + g.amount, 0);
console.log(`\nTotal Portfolio: $${totalValue.toLocaleString()}`);

// By risk level
const riskGroups = {};
for (const g of grants) {
  if (!riskGroups[g.risk]) riskGroups[g.risk] = { count: 0, value: 0 };
  riskGroups[g.risk].count++;
  riskGroups[g.risk].value += g.amount;
}
console.log("\nRisk Distribution:");
for (const [risk, data] of Object.entries(riskGroups)) {
  console.log(`  ${risk.padEnd(8)} ${data.count} grants | $${data.value.toLocaleString()}`);
}

// ===== 5. Milestone Progress =====
console.log("\n=== Milestone Progress ===\n");

for (const g of grants) {
  if (g.milestones === 0) continue;
  const pct = Math.round((g.milestonesComplete / g.milestones) * 100);
  const filled = Math.round(pct / 5);
  const bar = "=".repeat(filled) + "-".repeat(20 - filled);
  console.log(
    `  ${g.id} | [${bar}] ${pct}% (${g.milestonesComplete}/${g.milestones}) | ${g.title}`
  );
}

// ===== 6. Alerts & Action Items =====
console.log("\n=== Alerts & Action Items ===\n");

for (const g of grants) {
  const alerts = [];
  if (g.stage === "Draft" && g.daysInStage > 14) {
    alerts.push(`STALE: ${g.daysInStage} days in Draft - needs submission or cancellation`);
  }
  if (g.stage === "UnderReview" && g.daysInStage > 30) {
    alerts.push(`DELAYED: ${g.daysInStage} days under review - escalate to partner`);
  }
  if (g.stage === "Active" && g.daysInStage > 60 && g.milestonesComplete < g.milestones / 2) {
    alerts.push(`AT RISK: ${g.daysInStage} days active, only ${g.milestonesComplete}/${g.milestones} milestones complete`);
  }
  if (g.risk === "high") {
    alerts.push(`HIGH RISK: requires weekly partner review`);
  }
  if (g.stage === "Closeout") {
    alerts.push(`CLOSEOUT: verify all deliverables and final reporting`);
  }
  for (const a of alerts) {
    console.log(`  [${g.id}] ${a}`);
  }
}

// ===== 7. Graph Stats =====
console.log("\n=== Graph Summary ===");
const stats = db.cypher_stats();
console.log(`  Nodes: ${stats.node_count}`);
console.log(`  Edges: ${stats.edge_count}`);
console.log(`  Labels: ${stats.label_count}`);
console.log(`  Edge types: ${stats.edge_type_count}`);

// Query grants
console.log("\n--- All Grants in Graph ---");
try {
  const result = db.cypher("MATCH (g:Grant) RETURN g");
  console.log(`  Found ${result.rows?.length || 0} grants`);
} catch (e) {
  console.log(`  Query: ${e.message}`);
}

// Query reviewers
console.log("\n--- All Reviewers ---");
try {
  const result = db.cypher("MATCH (r:Reviewer) RETURN r");
  console.log(`  Found ${result.rows?.length || 0} reviewers`);
} catch (e) {
  console.log(`  Query: ${e.message}`);
}

console.log("\nDone.");
