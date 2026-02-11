/**
 * 11 - Huron Grant Matching & Recommendation Engine
 *
 * Uses vector similarity to match new funding opportunities
 * with Portland's departmental capabilities and past grants.
 * Helps Huron consultants identify the best-fit grants for
 * each city department.
 *
 * Run:  npm run matching
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const DIMS = 256;
const db = new RvLite(new RvLiteConfig(DIMS));

console.log("=== Huron Grant Matching Engine ===\n");

// --- Text embedding (hash-based, deterministic) ---
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

// ===== 1. Build Department Capability Profiles =====
console.log("--- Department Capability Profiles ---\n");

const departments = [
  {
    name: "Public Works",
    capabilities: "water infrastructure roads bridges stormwater sewer utilities construction engineering capital projects maintenance repair seismic retrofit safety ADA compliance",
    pastGrants: ["EPA Water Quality", "FHWA Bridge Repair", "FEMA Seismic Upgrade"],
    budget: 12000000,
    capacity: "high",
  },
  {
    name: "Education",
    capabilities: "schools youth stem after-school tutoring workforce development early childhood literacy college readiness career training digital learning equity access",
    pastGrants: ["NSF STEM Academy", "DOE Literacy Program", "AmeriCorps Youth"],
    budget: 4500000,
    capacity: "medium",
  },
  {
    name: "Housing",
    capabilities: "affordable housing homeless shelters rental assistance section 8 vouchers construction rehabilitation community development neighborhood revitalization fair housing tenant protection",
    pastGrants: ["HUD CDBG", "HOME Investment", "CoC Continuum of Care"],
    budget: 8000000,
    capacity: "high",
  },
  {
    name: "Environment",
    capabilities: "climate sustainability clean energy solar wind recycling waste reduction air quality river watershed parks urban forest green infrastructure carbon reduction emissions",
    pastGrants: ["EPA Clean Water", "DOE Solar Grant", "USDA Urban Forest"],
    budget: 3200000,
    capacity: "medium",
  },
  {
    name: "Health",
    capabilities: "public health mental health substance abuse crisis response epidemiology community health workers vaccination disease prevention maternal child health nutrition food access",
    pastGrants: ["SAMHSA Crisis Grant", "CDC Prevention", "HRSA Health Center"],
    budget: 5600000,
    capacity: "medium",
  },
  {
    name: "Transportation",
    capabilities: "transit bus rail light rail pedestrian bicycle safety signal priority traffic management parking electric vehicles fleet charging infrastructure multimodal complete streets",
    pastGrants: ["FTA Bus Rapid Transit", "FHWA Safe Streets", "DOT RAISE Grant"],
    budget: 9000000,
    capacity: "high",
  },
  {
    name: "Technology",
    capabilities: "broadband internet digital equity cybersecurity smart city IoT sensors data analytics open data GIS mapping 311 services modernization cloud computing artificial intelligence",
    pastGrants: ["NTIA Broadband", "NSF Smart City", "DHS Cybersecurity"],
    budget: 2800000,
    capacity: "low",
  },
];

for (const dept of departments) {
  const text = `${dept.name} ${dept.capabilities} ${dept.pastGrants.join(" ")}`;
  db.insert(textEmbed(text), {
    type: "department",
    name: dept.name,
    capacity: dept.capacity,
    budget: String(dept.budget),
  });
  console.log(`  Indexed: ${dept.name} (${dept.capacity} capacity, $${dept.budget.toLocaleString()})`);
}

// ===== 2. Index Funding Opportunities =====
console.log("\n--- Available Funding Opportunities ---\n");

const opportunities = [
  {
    id: "FO-2026-001",
    title: "EPA Clean Water State Revolving Fund",
    funder: "EPA",
    amount: 5000000,
    deadline: "2026-04-15",
    description: "Funding for water infrastructure improvements including drinking water treatment, stormwater management, and wastewater system upgrades in underserved communities.",
    keywords: "water infrastructure stormwater wastewater treatment drinking water utilities environmental compliance",
  },
  {
    id: "FO-2026-002",
    title: "NSF Broadening Participation in STEM",
    funder: "NSF",
    amount: 800000,
    deadline: "2026-03-01",
    description: "Grants to increase participation of underrepresented groups in STEM fields through innovative educational programs, mentorship, and community partnerships.",
    keywords: "stem education youth underrepresented equity mentorship science technology engineering math",
  },
  {
    id: "FO-2026-003",
    title: "HUD Choice Neighborhoods Implementation",
    funder: "HUD",
    amount: 30000000,
    deadline: "2026-06-30",
    description: "Transform distressed public and assisted housing into mixed-income neighborhoods with comprehensive community improvement strategies.",
    keywords: "housing neighborhood revitalization mixed-income public housing community development affordable",
  },
  {
    id: "FO-2026-004",
    title: "DOT RAISE Multimodal Grant",
    funder: "DOT",
    amount: 25000000,
    deadline: "2026-05-15",
    description: "Capital investments in surface transportation projects that improve safety, environmental sustainability, quality of life, mobility, and economic competitiveness.",
    keywords: "transportation multimodal safety infrastructure roads bridges transit pedestrian bicycle complete streets",
  },
  {
    id: "FO-2026-005",
    title: "SAMHSA Community Mental Health Block Grant",
    funder: "SAMHSA",
    amount: 1500000,
    deadline: "2026-02-28",
    description: "Support comprehensive community mental health services including crisis intervention, peer support, evidence-based treatment, and prevention programs.",
    keywords: "mental health crisis intervention community services substance abuse prevention treatment behavioral health",
  },
  {
    id: "FO-2026-006",
    title: "DOE Solar For All Community Program",
    funder: "DOE",
    amount: 4000000,
    deadline: "2026-07-01",
    description: "Deploy community solar installations benefiting low-income households with reduced energy costs and local clean energy jobs.",
    keywords: "solar energy renewable clean energy low-income community installation climate sustainability",
  },
  {
    id: "FO-2026-007",
    title: "NTIA Digital Equity Competitive Grant",
    funder: "NTIA",
    amount: 2000000,
    deadline: "2026-04-30",
    description: "Promote digital inclusion through affordable broadband access, digital literacy training, and device distribution for underserved populations.",
    keywords: "broadband digital equity internet access literacy devices underserved technology inclusion",
  },
  {
    id: "FO-2026-008",
    title: "FEMA Building Resilient Infrastructure",
    funder: "FEMA",
    amount: 10000000,
    deadline: "2026-03-15",
    description: "Pre-disaster mitigation projects that reduce risk from natural hazards including seismic retrofits, flood control, and climate adaptation infrastructure.",
    keywords: "disaster mitigation seismic flood resilience infrastructure safety hazard climate adaptation",
  },
];

for (const opp of opportunities) {
  const text = `${opp.title} ${opp.description} ${opp.keywords}`;
  db.insert(textEmbed(text), {
    type: "opportunity",
    foId: opp.id,
    title: opp.title,
    funder: opp.funder,
    amount: String(opp.amount),
    deadline: opp.deadline,
  });
  console.log(`  ${opp.id} | ${opp.funder.padEnd(6)} | $${opp.amount.toLocaleString().padStart(12)} | ${opp.title}`);
}

// ===== 3. Match Departments to Opportunities =====
console.log("\n=== Grant-Department Matching ===\n");

for (const dept of departments) {
  const deptText = `${dept.name} ${dept.capabilities} ${dept.pastGrants.join(" ")}`;
  const matches = db.search_with_filter(textEmbed(deptText), 3, { type: "opportunity" });

  console.log(`${dept.name} Department (${dept.capacity} capacity):`);
  for (let i = 0; i < matches.length; i++) {
    const m = meta(matches[i]);
    const score = matches[i].score;
    const fit = score > 0.5 ? "STRONG" : score > 0.35 ? "GOOD" : "MODERATE";
    console.log(
      `  ${i + 1}. [${fit}] ${m.title}` +
      `\n     Funder: ${m.funder} | $${Number(m.amount).toLocaleString()} | Deadline: ${m.deadline}` +
      `\n     Match Score: ${score.toFixed(4)}`
    );
  }
  console.log();
}

// ===== 4. Reverse Match: Which departments fit each opportunity? =====
console.log("=== Reverse Match: Best Department per Opportunity ===\n");

for (const opp of opportunities) {
  const oppText = `${opp.title} ${opp.description} ${opp.keywords}`;
  const matches = db.search_with_filter(textEmbed(oppText), 2, { type: "department" });

  if (matches.length === 0) {
    console.log(`  ${opp.id} ${opp.title}\n    No department matches found.`);
    continue;
  }

  const topDept = meta(matches[0]);
  const topScore = matches[0].score;
  const runnerUp = matches.length > 1 ? meta(matches[1]) : null;

  console.log(
    `  ${opp.id} ${opp.title}` +
    `\n    Best Fit: ${topDept.name} (${topScore.toFixed(4)})` +
    (runnerUp ? ` | Runner-up: ${runnerUp.name}` : "") +
    `\n    Recommendation: ${topScore > 0.45 ? "PURSUE" : topScore > 0.3 ? "EVALUATE" : "REVIEW"}`
  );
}

// ===== 5. Portfolio Fit Summary =====
console.log("\n=== Portfolio Fit Summary ===\n");

let totalPipeline = 0;
const deptOpps = {};

for (const dept of departments) {
  const deptText = `${dept.name} ${dept.capabilities}`;
  const matches = db.search_with_filter(textEmbed(deptText), 8, { type: "opportunity" });
  const strong = matches.filter(m => m.score > 0.25);
  deptOpps[dept.name] = strong.length;
  const oppValue = strong.reduce((sum, m) => sum + Number(meta(m).amount || 0), 0);
  totalPipeline += oppValue;

  console.log(
    `  ${dept.name.padEnd(16)} | ${strong.length} strong matches | Pipeline: $${oppValue.toLocaleString()}`
  );
}

console.log(`\n  Total Pipeline Value: $${totalPipeline.toLocaleString()}`);
console.log(`  Opportunities Tracked: ${opportunities.length}`);
console.log(`  Departments Profiled: ${departments.length}`);

console.log("\nDone.");
