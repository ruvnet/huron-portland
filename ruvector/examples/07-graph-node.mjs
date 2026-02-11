/**
 * 07 - Native Graph Database (graph-node)
 *
 * Uses @ruvector/graph-node for native Cypher queries,
 * hypergraph support, and persistence. 10x faster than WASM.
 *
 * REQUIRES: Native NAPI-RS bindings
 * Supported: Linux x64/arm64, macOS x64/arm64, Windows x64
 *
 * Run:  npm run graph-node
 */

let GraphDatabase;

try {
  const mod = await import("@ruvector/graph-node");
  GraphDatabase = mod.GraphDatabase || mod.default;
} catch (e) {
  console.error("@ruvector/graph-node requires native bindings (NAPI-RS).");
  console.error("Error:", e.message);
  process.exit(1);
}

// ===== 1. Create Graph Database =====
console.log("=== Native Graph Database ===\n");

const db = new GraphDatabase({
  dimensions: 128,
  distanceMetric: "Cosine",
});

// Create nodes with embeddings (all async)
const embed = (dim) => new Float32Array(dim).map(() => Math.random());

// Note: graph-node properties must be string values
const nodes = [
  { id: "dept-pw", label: "Department", properties: { name: "Public Works", budget: "5000000" } },
  { id: "dept-ed", label: "Department", properties: { name: "Education", budget: "3000000" } },
  { id: "dept-env", label: "Department", properties: { name: "Environment", budget: "2000000" } },
  { id: "grant-1", label: "Grant", properties: { title: "Water Infrastructure", amount: "500000" } },
  { id: "grant-2", label: "Grant", properties: { title: "STEM Academy", amount: "180000" } },
  { id: "grant-3", label: "Grant", properties: { title: "River Cleanup", amount: "200000" } },
];

for (const n of nodes) {
  try {
    const id = await db.createNode({ ...n, embedding: embed(128) });
    console.log(`Created node: ${n.id} (${n.label})`);
  } catch (e) {
    console.log(`Node ${n.id} error: ${e.message}`);
  }
}

// Create edges (uses "from"/"to" field names)
const edges = [
  { from: "grant-1", to: "dept-pw", label: "BELONGS_TO" },
  { from: "grant-2", to: "dept-ed", label: "BELONGS_TO" },
  { from: "grant-3", to: "dept-env", label: "BELONGS_TO" },
  { from: "dept-pw", to: "dept-env", label: "PARTNERS_WITH" },
];

for (const e of edges) {
  try {
    await db.createEdge({ ...e, properties: {}, description: e.label, embedding: embed(128) });
    console.log(`Created edge: ${e.from} -[${e.label}]-> ${e.to}`);
  } catch (err) {
    console.log(`Edge error: ${err.message}`);
  }
}

// ===== 2. Cypher Queries =====
console.log("\n=== Cypher Queries ===\n");

try {
  const grants = await db.query("MATCH (g:Grant) RETURN g");
  console.log("Grants:", JSON.stringify(grants, null, 2));
} catch (e) {
  console.log("Query error:", e.message);
}

// ===== 3. Hyperedges =====
console.log("\n=== Hyperedge ===\n");

try {
  const hid = await db.createHyperedge({
    label: "JOINT_INITIATIVE",
    nodes: ["dept-pw", "dept-env"],
    properties: { name: "Green Infrastructure Plan" },
    description: "Cross-department green initiative",
    embedding: embed(128),
    confidence: 0.92,
  });
  console.log("Hyperedge created:", hid);
} catch (e) {
  console.log("Hyperedge error:", e.message);
}

// ===== 4. Stats =====
console.log("\n=== Database Stats ===");
try {
  const stats = await db.stats();
  console.log(JSON.stringify(stats, null, 2));
} catch (e) {
  console.log("Stats:", e.message);
}

console.log("\nDone.");
