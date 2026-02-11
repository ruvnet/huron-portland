/**
 * 04 - Cypher Property Graph
 *
 * Model Portland's grants management as a property graph
 * with Cypher queries (Neo4j-style). RvLite WASM Cypher
 * supports CREATE nodes/edges and MATCH with single RETURN.
 *
 * Run:  npm run cypher
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const db = new RvLite(new RvLiteConfig(4));

// --- Create nodes: Departments ---
db.cypher(`CREATE (pw:Department {name: 'Public Works', budget_cap: 2000000})`);
db.cypher(`CREATE (ed:Department {name: 'Education', budget_cap: 1000000})`);
db.cypher(`CREATE (hs:Department {name: 'Housing', budget_cap: 1500000})`);
db.cypher(`CREATE (env:Department {name: 'Environment', budget_cap: 800000})`);

// --- Create nodes: Sponsors ---
db.cypher(`CREATE (alice:Sponsor {name: 'Alice Johnson', role: 'Director'})`);
db.cypher(`CREATE (bob:Sponsor {name: 'Bob Smith', role: 'Manager'})`);
db.cypher(`CREATE (carol:Sponsor {name: 'Carol Lee', role: 'Coordinator'})`);

// --- Create nodes: Grants ---
db.cypher(`CREATE (g1:Grant {title: 'Water Infrastructure', amount: 500000, status: 'approved'})`);
db.cypher(`CREATE (g2:Grant {title: 'STEM Program', amount: 150000, status: 'pending'})`);
db.cypher(`CREATE (g3:Grant {title: 'Affordable Housing', amount: 750000, status: 'approved'})`);
db.cypher(`CREATE (g4:Grant {title: 'River Cleanup', amount: 200000, status: 'pending'})`);
db.cypher(`CREATE (g5:Grant {title: 'Road Repair', amount: 300000, status: 'approved'})`);

// --- Create relationships ---
db.cypher(`CREATE (alice)-[:SPONSORS]->(g1)`);
db.cypher(`CREATE (alice)-[:SPONSORS]->(g3)`);
db.cypher(`CREATE (bob)-[:SPONSORS]->(g2)`);
db.cypher(`CREATE (carol)-[:SPONSORS]->(g4)`);
db.cypher(`CREATE (alice)-[:SPONSORS]->(g5)`);

db.cypher(`CREATE (g1)-[:BELONGS_TO]->(pw)`);
db.cypher(`CREATE (g2)-[:BELONGS_TO]->(ed)`);
db.cypher(`CREATE (g3)-[:BELONGS_TO]->(hs)`);
db.cypher(`CREATE (g4)-[:BELONGS_TO]->(env)`);
db.cypher(`CREATE (g5)-[:BELONGS_TO]->(pw)`);

db.cypher(`CREATE (pw)-[:PARTNERS_WITH]->(env)`);
db.cypher(`CREATE (ed)-[:PARTNERS_WITH]->(hs)`);

const stats = db.cypher_stats();
console.log("Graph stats:");
console.log(`  Nodes: ${stats.node_count}`);
console.log(`  Edges: ${stats.edge_count}`);
console.log(`  Labels: ${stats.label_count}`);
console.log(`  Edge types: ${stats.edge_type_count}`);

// --- Queries ---
function query(label, cypher) {
  console.log(`\n--- ${label} ---`);
  try {
    const result = db.cypher(cypher);
    if (result.columns?.length) {
      console.log(`  Columns: [${result.columns.join(", ")}]`);
    }
    console.log(`  Rows: ${result.rows?.length ?? 0}`);
    for (const row of result.rows || []) {
      console.log("  ", JSON.stringify(row));
    }
  } catch (e) {
    console.log(`  Error: ${e.message || e}`);
  }
}

// Query individual node types
query("All Grants", "MATCH (g:Grant) RETURN g");
query("All Sponsors", "MATCH (s:Sponsor) RETURN s");
query("All Departments", "MATCH (d:Department) RETURN d");

// Query relationships (single variable RETURN)
query("Sponsor -> Grant edges",
  "MATCH (s:Sponsor)-[r:SPONSORS]->(g:Grant) RETURN r");

query("Grant -> Department edges",
  "MATCH (g:Grant)-[r:BELONGS_TO]->(d:Department) RETURN r");

query("Department partnerships",
  "MATCH (d1:Department)-[r:PARTNERS_WITH]->(d2:Department) RETURN r");

// Show final stats
console.log("\n--- Final Graph Summary ---");
const final = db.cypher_stats();
console.log(JSON.stringify(final, null, 2));
