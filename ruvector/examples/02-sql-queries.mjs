/**
 * 02 - SQL Vector Search
 *
 * Use SQL syntax for vector similarity search.
 * RvLite SQL is vector-first: tables need a VECTOR column,
 * and SELECT uses ORDER BY v <-> [query] for similarity.
 *
 * Run:  npm run sql
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const DIMS = 4;
const db = new RvLite(new RvLiteConfig(DIMS));

// --- Create table (column names cannot be reserved words) ---
db.sql(`CREATE TABLE grants (v VECTOR(${DIMS}), gid TEXT, gtitle TEXT, gamount REAL, gstatus TEXT)`);
console.log("Table 'grants' created.\n");

// --- Insert grant proposals ---
const grants = [
  { id: "G-001", vec: [0.9, 0.1, 0.2, 0.3], title: "Water Infrastructure", amount: 500000, status: "pending" },
  { id: "G-002", vec: [0.1, 0.9, 0.2, 0.1], title: "Youth STEM Program", amount: 150000, status: "approved" },
  { id: "G-003", vec: [0.2, 0.1, 0.9, 0.3], title: "Affordable Housing", amount: 750000, status: "pending" },
  { id: "G-004", vec: [0.8, 0.2, 0.3, 0.4], title: "Road Repair Phase II", amount: 300000, status: "approved" },
  { id: "G-005", vec: [0.1, 0.8, 0.1, 0.2], title: "Community College Fund", amount: 200000, status: "pending" },
];

for (const g of grants) {
  db.sql(
    `INSERT INTO grants (v, gid, gtitle, gamount, gstatus) VALUES (` +
    `[${g.vec.join(",")}], '${g.id}', '${g.title}', ${g.amount}, '${g.status}')`
  );
}
console.log(`Inserted ${grants.length} grants.\n`);

// --- Vector similarity search via SQL ---
console.log("--- Nearest to [0.85, 0.15, 0.25, 0.35] (infrastructure-like) ---");
const similar = db.sql(
  "SELECT * FROM grants ORDER BY v <-> [0.85, 0.15, 0.25, 0.35] LIMIT 3"
);

// Format results (values are typed: {Text: "..."}, {Real: 123})
function val(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.Text || v.Real || v.Integer || JSON.stringify(v);
  return v;
}

for (const row of similar.rows) {
  console.log(
    `  ${val(row.gid)} | ${val(row.gtitle).padEnd(25)} | $${Number(val(row.gamount)).toLocaleString().padStart(10)} | ${val(row.gstatus).padEnd(8)} | dist: ${val(row._distance).toFixed?.(4) ?? val(row._distance)}`
  );
}

// --- Second search: education-focused ---
console.log("\n--- Nearest to [0.1, 0.85, 0.15, 0.15] (education-like) ---");
const eduResults = db.sql(
  "SELECT * FROM grants ORDER BY v <-> [0.1, 0.85, 0.15, 0.15] LIMIT 3"
);

for (const row of eduResults.rows) {
  console.log(
    `  ${val(row.gid)} | ${val(row.gtitle).padEnd(25)} | dist: ${Number(val(row._distance)).toFixed(4)}`
  );
}

// --- Third search: housing-focused ---
console.log("\n--- Nearest to [0.2, 0.1, 0.85, 0.3] (housing-like) ---");
const housResults = db.sql(
  "SELECT * FROM grants ORDER BY v <-> [0.2, 0.1, 0.85, 0.3] LIMIT 3"
);

for (const row of housResults.rows) {
  console.log(
    `  ${val(row.gid)} | ${val(row.gtitle).padEnd(25)} | dist: ${Number(val(row._distance)).toFixed(4)}`
  );
}
