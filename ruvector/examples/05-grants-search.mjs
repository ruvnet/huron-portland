/**
 * 05 - Grants Semantic Search
 *
 * Domain-specific example: index grant proposals with
 * text embeddings and perform similarity search.
 * Uses a simple hash-based embedding for demonstration.
 *
 * Run:  npm run grants
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const DIMS = 256;
const db = new RvLite(new RvLiteConfig(DIMS));

// --- Simple text embedding (hash-based, deterministic) ---
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

// Helper: convert Map metadata to plain object
function meta(entry) {
  if (entry.metadata instanceof Map) return Object.fromEntries(entry.metadata);
  return entry.metadata || {};
}

// --- Portland grant proposals dataset ---
const proposals = [
  {
    title: "Willamette River Water Quality Monitoring",
    department: "Environment",
    amount: 320000,
    description: "Deploy IoT sensors along the Willamette River to continuously monitor water quality metrics including pH, dissolved oxygen, turbidity, and contaminant levels.",
    tags: ["water", "environment", "iot", "monitoring"],
  },
  {
    title: "Portland Youth STEM Academy",
    department: "Education",
    amount: 180000,
    description: "After-school program providing hands-on science, technology, engineering, and math education to underserved middle school students across Portland.",
    tags: ["education", "youth", "stem", "equity"],
  },
  {
    title: "Burnside Bridge Seismic Retrofit",
    department: "Public Works",
    amount: 2500000,
    description: "Critical seismic upgrade to the Burnside Bridge to meet current earthquake resilience standards and ensure pedestrian and vehicle safety.",
    tags: ["infrastructure", "bridge", "seismic", "safety"],
  },
  {
    title: "Affordable Housing Trust Fund",
    department: "Housing",
    amount: 1200000,
    description: "Establish a revolving fund to support construction and rehabilitation of affordable housing units in East Portland neighborhoods.",
    tags: ["housing", "affordable", "construction", "equity"],
  },
  {
    title: "Community Solar Garden Initiative",
    department: "Environment",
    amount: 450000,
    description: "Install community solar arrays on public buildings providing clean energy credits to low-income Portland residents.",
    tags: ["solar", "energy", "environment", "equity"],
  },
  {
    title: "Small Business Recovery Program",
    department: "Economic Development",
    amount: 600000,
    description: "Grants and technical assistance for small businesses in downtown Portland recovering from economic disruption.",
    tags: ["business", "economy", "recovery", "downtown"],
  },
  {
    title: "Public Transit Signal Priority",
    department: "Transportation",
    amount: 380000,
    description: "Upgrade traffic signals along major TriMet bus corridors to provide transit signal priority reducing commute times by 15%.",
    tags: ["transit", "transportation", "signals", "infrastructure"],
  },
  {
    title: "Urban Tree Canopy Expansion",
    department: "Parks",
    amount: 250000,
    description: "Plant 5,000 native trees in heat-island neighborhoods to increase canopy cover, reduce temperatures, and improve air quality.",
    tags: ["trees", "parks", "climate", "health"],
  },
  {
    title: "Mental Health First Responder Program",
    department: "Health",
    amount: 520000,
    description: "Train and deploy specialized mental health crisis response teams as an alternative to traditional police dispatch for behavioral health calls.",
    tags: ["health", "mental-health", "crisis", "public-safety"],
  },
  {
    title: "Digital Equity Internet Access",
    department: "Technology",
    amount: 350000,
    description: "Provide free high-speed internet access and devices to 2,000 low-income households in underserved Portland neighborhoods.",
    tags: ["technology", "internet", "equity", "digital"],
  },
];

// --- Index all proposals ---
console.log("Indexing proposals...\n");
for (const p of proposals) {
  const text = `${p.title} ${p.description} ${p.tags.join(" ")} ${p.department}`;
  db.insert(textEmbed(text), {
    title: p.title,
    department: p.department,
    amount: String(p.amount),
  });
}
console.log(`Indexed ${db.len()} proposals.\n`);

// --- Search queries ---
const queries = [
  "water quality river environmental monitoring",
  "affordable housing construction low income",
  "youth education technology stem",
  "infrastructure bridge road repair",
  "clean energy solar renewable",
  "mental health crisis response",
];

for (const q of queries) {
  console.log(`Query: "${q}"`);
  console.log("-".repeat(60));
  const results = db.search(textEmbed(q), 3);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const m = meta(r);
    console.log(
      `  ${i + 1}. ${m.title || r.id}` +
      `\n     Dept: ${m.department || "?"} | $${Number(m.amount || 0).toLocaleString()}` +
      `\n     Score: ${r.score.toFixed(4)}`
    );
  }
  console.log();
}

// --- Filtered search: Environment department only ---
console.log("=== Environment Department Only ===");
const envResults = db.search_with_filter(
  textEmbed("climate sustainability green"),
  3,
  { department: "Environment" }
);
for (const r of envResults) {
  const m = meta(r);
  console.log(`  - ${m.title || r.id} (score: ${r.score.toFixed(4)})`);
}
