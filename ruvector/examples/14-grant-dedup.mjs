/**
 * 14 - Huron Grant Deduplication & Overlap Detection
 *
 * Uses vector similarity to detect duplicate or overlapping
 * grant proposals across departments. Prevents double-dipping
 * and identifies coordination opportunities.
 *
 * Run:  npm run dedup
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const DIMS = 256;
const db = new RvLite(new RvLiteConfig(DIMS));

console.log("=== Huron Grant Deduplication & Overlap Detection ===\n");

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

// ===== 1. All Submissions (from multiple departments, some overlapping) =====
const submissions = [
  // Clearly distinct grants
  {
    id: "SUB-001", dept: "Public Works", funder: "EPA",
    title: "Stormwater System Modernization",
    description: "Replace aging stormwater pipes and install green infrastructure including bioswales rain gardens and permeable pavement across 12 Portland neighborhoods to reduce combined sewer overflows",
    amount: 3200000,
  },
  {
    id: "SUB-002", dept: "Education", funder: "NSF",
    title: "Coding Bootcamp for Portland Youth",
    description: "Intensive coding and computer science education program for high school students in Title I schools featuring web development data science and cybersecurity tracks",
    amount: 280000,
  },

  // Overlapping pair 1: water quality monitoring from two departments
  {
    id: "SUB-003", dept: "Environment", funder: "EPA",
    title: "Willamette River Water Quality Sensors",
    description: "Deploy network of IoT water quality sensors along the Willamette River measuring pH dissolved oxygen temperature turbidity and pollutant levels with real time dashboard",
    amount: 420000,
  },
  {
    id: "SUB-004", dept: "Public Works", funder: "EPA",
    title: "Water Quality Monitoring Infrastructure",
    description: "Install water quality monitoring stations along the Willamette River and Columbia Slough with automated sensors for pH dissolved oxygen turbidity and contaminant detection",
    amount: 380000,
  },

  // Overlapping pair 2: digital equity from two departments
  {
    id: "SUB-005", dept: "Technology", funder: "NTIA",
    title: "Portland Digital Equity Initiative",
    description: "Provide free broadband internet access and computer devices to low income households in underserved neighborhoods with digital literacy training and tech support",
    amount: 1500000,
  },
  {
    id: "SUB-006", dept: "Education", funder: "NTIA",
    title: "Digital Access for Portland Students",
    description: "Equip underserved students with laptops and home internet connections including digital literacy curriculum and family technology training workshops",
    amount: 650000,
  },

  // Overlapping pair 3: urban greening from two departments
  {
    id: "SUB-007", dept: "Parks", funder: "USDA",
    title: "Urban Forest Restoration Program",
    description: "Plant 8000 native trees in heat island neighborhoods increase urban canopy cover reduce summer temperatures improve air quality and create green corridors",
    amount: 480000,
  },
  {
    id: "SUB-008", dept: "Environment", funder: "USDA",
    title: "Portland Tree Canopy and Climate Resilience",
    description: "Expand urban tree canopy in environmental justice communities plant native species reduce heat island effect improve air quality and increase carbon sequestration",
    amount: 520000,
  },

  // Clearly distinct
  {
    id: "SUB-009", dept: "Housing", funder: "HUD",
    title: "Permanent Supportive Housing Development",
    description: "Construct 80 units of permanent supportive housing for chronically homeless individuals with wraparound services including case management healthcare and employment assistance",
    amount: 6200000,
  },
  {
    id: "SUB-010", dept: "Transportation", funder: "FTA",
    title: "Electric Bus Fleet Transition",
    description: "Purchase 25 battery electric buses and install charging infrastructure at TriMet depots to transition Portland public transit fleet to zero emission vehicles",
    amount: 15000000,
  },

  // Near-duplicate: same department, very similar scope
  {
    id: "SUB-011", dept: "Health", funder: "SAMHSA",
    title: "Community Crisis Response Team",
    description: "Deploy mobile mental health crisis response teams with trained counselors and peer specialists as alternative to police dispatch for behavioral health emergencies",
    amount: 780000,
  },
  {
    id: "SUB-012", dept: "Health", funder: "HRSA",
    title: "Mental Health Emergency Response Program",
    description: "Create mobile crisis intervention teams staffed with mental health professionals and peer support specialists to respond to behavioral health emergencies in Portland",
    amount: 640000,
  },
];

// Index all submissions
for (const sub of submissions) {
  const text = `${sub.title} ${sub.description} ${sub.dept} ${sub.funder}`;
  db.insert_with_id(sub.id, textEmbed(text), {
    dept: sub.dept,
    funder: sub.funder,
    title: sub.title,
    amount: String(sub.amount),
  });
}

console.log(`Indexed ${submissions.length} submissions.\n`);

// ===== 2. Pairwise Overlap Detection =====
console.log("=== Pairwise Overlap Analysis ===\n");

const OVERLAP_THRESHOLD = 0.40;
const DUPLICATE_THRESHOLD = 0.50;
const overlaps = [];

for (let i = 0; i < submissions.length; i++) {
  const sub = submissions[i];
  const text = `${sub.title} ${sub.description} ${sub.dept} ${sub.funder}`;
  const results = db.search(textEmbed(text), 4);

  for (const r of results) {
    const m = meta(r);
    if (r.id === sub.id) continue; // skip self
    if (r.score < OVERLAP_THRESHOLD) continue;

    // Avoid duplicate pairs
    const pairKey = [sub.id, r.id].sort().join("-");
    if (overlaps.find(o => o.key === pairKey)) continue;

    overlaps.push({
      key: pairKey,
      a: sub,
      b: { id: r.id, ...m },
      score: r.score,
      isDuplicate: r.score >= DUPLICATE_THRESHOLD,
    });
  }
}

// Sort by score descending
overlaps.sort((a, b) => b.score - a.score);

if (overlaps.length === 0) {
  console.log("  No overlaps detected above threshold.\n");
} else {
  for (const o of overlaps) {
    const label = o.isDuplicate ? "LIKELY DUPLICATE" : "OVERLAP DETECTED";
    const icon = o.isDuplicate ? "!!" : "! ";
    console.log(`[${icon}] ${label} (similarity: ${o.score.toFixed(4)})`);
    console.log(`    A: ${o.a.id} | ${o.a.dept.padEnd(14)} | ${o.a.title}`);
    console.log(`       Funder: ${o.a.funder} | $${Number(o.a.amount).toLocaleString()}`);
    console.log(`    B: ${o.b.id} | ${(o.b.dept || "").padEnd(14)} | ${o.b.title}`);
    console.log(`       Funder: ${o.b.funder || "?"} | $${Number(o.b.amount || 0).toLocaleString()}`);

    // Recommendation
    if (o.isDuplicate) {
      if (o.a.dept === (o.b.dept || "")) {
        console.log(`    ACTION: Same department - merge into single stronger proposal`);
      } else {
        console.log(`    ACTION: Cross-department overlap - coordinate joint submission or designate lead`);
      }
    } else {
      console.log(`    ACTION: Review for scope differentiation and complementary framing`);
    }
    console.log();
  }
}

// ===== 3. Summary Report =====
console.log("=== Deduplication Summary ===\n");

const duplicates = overlaps.filter(o => o.isDuplicate);
const partialOverlaps = overlaps.filter(o => !o.isDuplicate);

console.log(`  Total Submissions: ${submissions.length}`);
console.log(`  Likely Duplicates: ${duplicates.length}`);
console.log(`  Partial Overlaps: ${partialOverlaps.length}`);
console.log(`  Clean (no overlap): ${submissions.length - new Set(overlaps.flatMap(o => [o.a.id, o.b.id])).size}`);

// Departments with most overlaps
const deptOverlaps = {};
for (const o of overlaps) {
  deptOverlaps[o.a.dept] = (deptOverlaps[o.a.dept] || 0) + 1;
  const bDept = o.b.dept || "";
  if (bDept) deptOverlaps[bDept] = (deptOverlaps[bDept] || 0) + 1;
}

if (Object.keys(deptOverlaps).length > 0) {
  console.log("\n  Departments with overlapping submissions:");
  for (const [dept, count] of Object.entries(deptOverlaps).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${dept}: ${count} overlap(s)`);
  }
}

// Value at risk from duplicates
const dupValue = duplicates.reduce((sum, o) => sum + Math.min(Number(o.a.amount), Number(o.b.amount || 0)), 0);
if (dupValue > 0) {
  console.log(`\n  Potential value at risk (lower of each duplicate pair): $${dupValue.toLocaleString()}`);
  console.log(`  Recommendation: Consolidate duplicate submissions before funder review`);
}

// ===== 4. Coordination Opportunities =====
console.log("\n=== Coordination Opportunities ===\n");

const crossDept = overlaps.filter(o => o.a.dept !== (o.b.dept || ""));
if (crossDept.length > 0) {
  console.log("Cross-department proposals that could benefit from joint coordination:\n");
  for (const o of crossDept) {
    const combined = Number(o.a.amount) + Number(o.b.amount || 0);
    console.log(`  ${o.a.dept} + ${o.b.dept || "?"}`);
    console.log(`    "${o.a.title}" + "${o.b.title || "?"}"`);
    console.log(`    Combined value: $${combined.toLocaleString()}`);
    console.log(`    Strategy: Joint proposal with ${o.a.dept} as lead, ${o.b.dept || "?"} as co-PI`);
    console.log();
  }
} else {
  console.log("  No cross-department coordination opportunities found.\n");
}

console.log("Done.");
