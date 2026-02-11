/**
 * 13 - Huron Grant Portfolio Analytics
 *
 * Comprehensive portfolio analysis combining vector search,
 * SQL aggregation patterns, and graph relationships for
 * Huron's Portland grants practice.
 *
 * Run:  npm run portfolio
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

console.log("=== Huron Portland Grant Portfolio Analytics ===\n");

// ===== Databases =====
const DIMS = 256;
const vectorDb = new RvLite(new RvLiteConfig(DIMS));
const sqlDb = new RvLite(new RvLiteConfig(4));
const graphDb = new RvLite(new RvLiteConfig(4));

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

// ===== 1. Portfolio Dataset =====
const portfolio = [
  {
    id: "HCG-PDX-001", title: "Water Infrastructure Modernization",
    department: "Public Works", funder: "EPA", amount: 2500000,
    status: "active", startDate: "2025-06-01", endDate: "2027-05-31",
    spent: 875000, drawdown: 35, risk: "low",
    description: "Comprehensive upgrade of Portland water distribution system including pipe replacement lead service line removal and smart meter installation",
    fte: 3.5, subrecipients: 2,
  },
  {
    id: "HCG-PDX-002", title: "Youth STEM Education Initiative",
    department: "Education", funder: "NSF", amount: 450000,
    status: "review", startDate: "2026-01-15", endDate: "2028-01-14",
    spent: 0, drawdown: 0, risk: "medium",
    description: "After school STEM academy for underserved youth coding robotics science experiments mentorship career exposure",
    fte: 1.5, subrecipients: 1,
  },
  {
    id: "HCG-PDX-003", title: "Affordable Housing Trust Fund",
    department: "Housing", funder: "HUD", amount: 3200000,
    status: "active", startDate: "2025-09-01", endDate: "2028-08-31",
    spent: 736000, drawdown: 23, risk: "low",
    description: "Revolving fund for affordable housing construction and rehabilitation in East Portland underserved neighborhoods",
    fte: 2.0, subrecipients: 4,
  },
  {
    id: "HCG-PDX-004", title: "Community Mental Health Program",
    department: "Health", funder: "SAMHSA", amount: 780000,
    status: "draft", startDate: "", endDate: "",
    spent: 0, drawdown: 0, risk: "high",
    description: "Mobile crisis response teams peer counselors behavioral health integration community wellness centers substance abuse prevention",
    fte: 0, subrecipients: 0,
  },
  {
    id: "HCG-PDX-005", title: "Burnside Bridge Seismic Retrofit",
    department: "Transportation", funder: "FHWA", amount: 8500000,
    status: "active", startDate: "2024-10-01", endDate: "2027-09-30",
    spent: 5525000, drawdown: 65, risk: "medium",
    description: "Major seismic retrofit and structural upgrade of the Burnside Bridge to meet current earthquake resilience standards",
    fte: 5.0, subrecipients: 3,
  },
  {
    id: "HCG-PDX-006", title: "Digital Equity Broadband Access",
    department: "Technology", funder: "NTIA", amount: 1200000,
    status: "closeout", startDate: "2024-01-01", endDate: "2025-12-31",
    spent: 1140000, drawdown: 95, risk: "low",
    description: "Free broadband internet access devices digital literacy training for 2000 low income households in underserved Portland neighborhoods",
    fte: 1.0, subrecipients: 1,
  },
  {
    id: "HCG-PDX-007", title: "Community Solar Garden",
    department: "Environment", funder: "DOE", amount: 4000000,
    status: "active", startDate: "2025-04-01", endDate: "2028-03-31",
    spent: 1200000, drawdown: 30, risk: "low",
    description: "Community solar installations on public buildings clean energy credits for low income residents green jobs training",
    fte: 2.5, subrecipients: 2,
  },
  {
    id: "HCG-PDX-008", title: "Urban Tree Canopy Expansion",
    department: "Parks", funder: "USDA", amount: 350000,
    status: "active", startDate: "2025-07-01", endDate: "2027-06-30",
    spent: 105000, drawdown: 30, risk: "low",
    description: "Plant 5000 native trees in heat island neighborhoods increase canopy cover reduce temperatures improve air quality",
    fte: 1.0, subrecipients: 0,
  },
  {
    id: "HCG-PDX-009", title: "TriMet Bus Signal Priority",
    department: "Transportation", funder: "FTA", amount: 2800000,
    status: "active", startDate: "2025-03-01", endDate: "2027-02-28",
    spent: 1120000, drawdown: 40, risk: "low",
    description: "Traffic signal priority system for major bus corridors to reduce commute times improve transit reliability and ridership",
    fte: 2.0, subrecipients: 1,
  },
  {
    id: "HCG-PDX-010", title: "Small Business Recovery Grants",
    department: "Economic Dev", funder: "EDA", amount: 900000,
    status: "active", startDate: "2025-08-01", endDate: "2026-07-31",
    spent: 540000, drawdown: 60, risk: "medium",
    description: "Direct grants and technical assistance to small businesses in downtown Portland economic recovery workforce retention",
    fte: 1.5, subrecipients: 0,
  },
];

// ===== 2. Index for Vector Search =====
for (const g of portfolio) {
  vectorDb.insert(textEmbed(`${g.title} ${g.description} ${g.department} ${g.funder}`), {
    grantId: g.id,
    title: g.title,
    department: g.department,
    funder: g.funder,
    amount: String(g.amount),
    status: g.status,
    risk: g.risk,
    drawdown: String(g.drawdown),
  });
}
console.log(`Indexed ${portfolio.length} grants for vector search.\n`);

// ===== 3. SQL Table for Financial Queries =====
sqlDb.sql(`CREATE TABLE portfolio (
  v VECTOR(4),
  gid TEXT,
  dept TEXT,
  funder TEXT,
  gamount REAL,
  gspent REAL,
  gdrawdown REAL,
  grisk TEXT,
  gstatus TEXT
)`);

for (const g of portfolio) {
  // Simple 4D vector: [normalized_amount, drawdown%, risk_score, fte_ratio]
  const maxAmt = 10000000;
  const riskScore = g.risk === "high" ? 0.9 : g.risk === "medium" ? 0.5 : 0.1;
  const vec = [
    g.amount / maxAmt,
    g.drawdown / 100,
    riskScore,
    Math.min(g.fte / 5, 1),
  ];
  sqlDb.sql(
    `INSERT INTO portfolio (v, gid, dept, funder, gamount, gspent, gdrawdown, grisk, gstatus) VALUES (` +
    `[${vec.join(",")}], '${g.id}', '${g.department}', '${g.funder}', ${g.amount}, ${g.spent}, ${g.drawdown}, '${g.risk}', '${g.status}')`
  );
}

// ===== 4. Graph: Department-Funder-Grant Relationships =====
const deptSet = [...new Set(portfolio.map(g => g.department))];
const funderSet = [...new Set(portfolio.map(g => g.funder))];

for (const d of deptSet) {
  graphDb.cypher(`CREATE (d:Department {name: '${d}'})`);
}
for (const f of funderSet) {
  graphDb.cypher(`CREATE (f:Funder {name: '${f}'})`);
}
for (const g of portfolio) {
  graphDb.cypher(`CREATE (g:Grant {grantId: '${g.id}', title: '${g.title}', status: '${g.status}'})`);
}

// =====================================================
// ANALYTICS
// =====================================================

// ===== A. Executive Summary =====
console.log("=== Executive Summary ===\n");

const activeGrants = portfolio.filter(g => g.status === "active");
const totalAwarded = portfolio.reduce((s, g) => s + g.amount, 0);
const totalSpent = portfolio.reduce((s, g) => s + g.spent, 0);
const totalFTE = portfolio.reduce((s, g) => s + g.fte, 0);
const avgDrawdown = activeGrants.length > 0
  ? activeGrants.reduce((s, g) => s + g.drawdown, 0) / activeGrants.length
  : 0;

console.log(`  Total Grants: ${portfolio.length}`);
console.log(`  Active: ${activeGrants.length} | Draft: ${portfolio.filter(g => g.status === "draft").length} | Review: ${portfolio.filter(g => g.status === "review").length} | Closeout: ${portfolio.filter(g => g.status === "closeout").length}`);
console.log(`  Total Awarded: $${totalAwarded.toLocaleString()}`);
console.log(`  Total Spent: $${totalSpent.toLocaleString()}`);
console.log(`  Avg Drawdown (Active): ${avgDrawdown.toFixed(1)}%`);
console.log(`  Total FTE: ${totalFTE}`);
console.log(`  Subrecipients: ${portfolio.reduce((s, g) => s + g.subrecipients, 0)}`);

// ===== B. Department Breakdown =====
console.log("\n=== Department Breakdown ===\n");

const byDept = {};
for (const g of portfolio) {
  if (!byDept[g.department]) byDept[g.department] = { count: 0, awarded: 0, spent: 0, fte: 0 };
  byDept[g.department].count++;
  byDept[g.department].awarded += g.amount;
  byDept[g.department].spent += g.spent;
  byDept[g.department].fte += g.fte;
}

console.log(`  ${"Department".padEnd(18)} | ${"Grants".padEnd(6)} | ${"Awarded".padEnd(14)} | ${"Spent".padEnd(14)} | FTE`);
console.log(`  ${"-".repeat(18)} | ${"-".repeat(6)} | ${"-".repeat(14)} | ${"-".repeat(14)} | ${"-".repeat(4)}`);
for (const [dept, data] of Object.entries(byDept).sort((a, b) => b[1].awarded - a[1].awarded)) {
  console.log(
    `  ${dept.padEnd(18)} | ${String(data.count).padEnd(6)} | $${data.awarded.toLocaleString().padStart(12)} | $${data.spent.toLocaleString().padStart(12)} | ${data.fte}`
  );
}

// ===== C. Funder Breakdown =====
console.log("\n=== Funder Breakdown ===\n");

const byFunder = {};
for (const g of portfolio) {
  if (!byFunder[g.funder]) byFunder[g.funder] = { count: 0, awarded: 0 };
  byFunder[g.funder].count++;
  byFunder[g.funder].awarded += g.amount;
}

for (const [funder, data] of Object.entries(byFunder).sort((a, b) => b[1].awarded - a[1].awarded)) {
  const pct = Math.round((data.awarded / totalAwarded) * 100);
  const bar = "#".repeat(Math.round(pct / 2));
  console.log(`  ${funder.padEnd(8)} $${data.awarded.toLocaleString().padStart(12)} (${String(pct).padStart(2)}%) ${bar}`);
}

// ===== D. Drawdown Analysis =====
console.log("\n=== Drawdown Analysis (Active Grants) ===\n");

for (const g of activeGrants.sort((a, b) => a.drawdown - b.drawdown)) {
  const filled = Math.round(g.drawdown / 5);
  const bar = "=".repeat(filled) + "-".repeat(20 - filled);
  const flag = g.drawdown < 25 ? " SLOW" : g.drawdown > 75 ? " FAST" : "";
  console.log(
    `  ${g.id} [${bar}] ${String(g.drawdown).padStart(3)}% | $${g.spent.toLocaleString().padStart(12)} of $${g.amount.toLocaleString()}${flag}`
  );
}

// ===== E. Risk Heat Map =====
console.log("\n=== Risk Assessment ===\n");

for (const g of portfolio) {
  let riskFactors = [];
  if (g.risk === "high") riskFactors.push("inherent-high");
  if (g.status === "active" && g.drawdown < 20) riskFactors.push("slow-drawdown");
  if (g.status === "active" && g.drawdown > 80 && g.endDate > "2027-01-01") riskFactors.push("fast-burn");
  if (g.subrecipients >= 3) riskFactors.push("complex-sub-monitoring");
  if (g.amount > 5000000) riskFactors.push("high-value");

  const riskLevel = riskFactors.length >= 2 ? "HIGH" : riskFactors.length === 1 ? "MED " : "LOW ";
  if (riskFactors.length > 0) {
    console.log(`  [${riskLevel}] ${g.id} ${g.title}`);
    console.log(`         Factors: ${riskFactors.join(", ")}`);
  }
}

// ===== F. SQL: Similar Financial Profile =====
console.log("\n=== SQL: Grants with Similar Financial Profile ===\n");

// Find grants financially similar to Burnside Bridge (high spend, medium risk)
console.log("Similar to Burnside Bridge (high-value, mid-drawdown):");
const sqlResults = sqlDb.sql(
  "SELECT * FROM portfolio ORDER BY v <-> [0.85, 0.65, 0.5, 0.8] LIMIT 3"
);
function val(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.Text || v.Real || v.Integer || JSON.stringify(v);
  return v;
}
for (const row of sqlResults.rows) {
  console.log(`  ${val(row.gid)} | ${val(row.dept).padEnd(16)} | $${Number(val(row.gamount)).toLocaleString().padStart(12)} | ${val(row.gdrawdown)}% drawn`);
}

// Find low-risk, early-stage grants
console.log("\nSimilar to low-risk early-stage profile:");
const earlyResults = sqlDb.sql(
  "SELECT * FROM portfolio ORDER BY v <-> [0.1, 0.1, 0.1, 0.2] LIMIT 3"
);
for (const row of earlyResults.rows) {
  console.log(`  ${val(row.gid)} | ${val(row.dept).padEnd(16)} | ${val(row.grisk)} risk | ${val(row.gstatus)}`);
}

// ===== G. Semantic Search =====
console.log("\n=== Semantic Search ===\n");

const searchQueries = [
  "transportation infrastructure bridge road safety",
  "housing affordable community development",
  "technology digital internet equity access",
  "environmental sustainability clean energy climate",
];

for (const q of searchQueries) {
  const results = vectorDb.search(textEmbed(q), 2);
  console.log(`"${q}"`);
  for (const r of results) {
    const m = meta(r);
    console.log(`  -> ${m.title} (${m.department}, ${m.status}, score: ${r.score.toFixed(4)})`);
  }
  console.log();
}

// ===== H. Graph Stats =====
console.log("=== Graph Summary ===");
const gStats = graphDb.cypher_stats();
console.log(`  Nodes: ${gStats.node_count} (${deptSet.length} depts, ${funderSet.length} funders, ${portfolio.length} grants)`);
console.log(`  Labels: ${gStats.label_count}`);

console.log("\nDone.");
