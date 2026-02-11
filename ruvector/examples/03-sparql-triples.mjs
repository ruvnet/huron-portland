/**
 * 03 - SPARQL & RDF Triple Store
 *
 * Model grant relationships as RDF triples and query
 * with SPARQL. Uses simple triple patterns.
 *
 * Run:  npm run sparql
 */
import { initRvlite } from "./lib/wasm-loader.mjs";
const { RvLite, RvLiteConfig } = await initRvlite();

const db = new RvLite(new RvLiteConfig(4));

const EX = "http://portland.huron.example/";

// --- Build a grants knowledge graph ---
const triples = [
  // Grant entities
  [`<${EX}grant/G001>`, `<${EX}hasTitle>`, `"Water Infrastructure Upgrade"`],
  [`<${EX}grant/G001>`, `<${EX}hasBudget>`, `"500000"`],
  [`<${EX}grant/G001>`, `<${EX}hasDepartment>`, `<${EX}dept/PublicWorks>`],
  [`<${EX}grant/G001>`, `<${EX}hasSponsor>`, `<${EX}person/AliceJohnson>`],

  [`<${EX}grant/G002>`, `<${EX}hasTitle>`, `"Youth STEM Initiative"`],
  [`<${EX}grant/G002>`, `<${EX}hasBudget>`, `"150000"`],
  [`<${EX}grant/G002>`, `<${EX}hasDepartment>`, `<${EX}dept/Education>`],
  [`<${EX}grant/G002>`, `<${EX}hasSponsor>`, `<${EX}person/BobSmith>`],

  [`<${EX}grant/G003>`, `<${EX}hasTitle>`, `"Affordable Housing Fund"`],
  [`<${EX}grant/G003>`, `<${EX}hasBudget>`, `"750000"`],
  [`<${EX}grant/G003>`, `<${EX}hasDepartment>`, `<${EX}dept/Housing>`],
  [`<${EX}grant/G003>`, `<${EX}hasSponsor>`, `<${EX}person/AliceJohnson>`],

  // Department metadata
  [`<${EX}dept/PublicWorks>`, `<${EX}deptName>`, `"Public Works"`],
  [`<${EX}dept/Education>`, `<${EX}deptName>`, `"Education"`],
  [`<${EX}dept/Housing>`, `<${EX}deptName>`, `"Housing & Development"`],

  // People
  [`<${EX}person/AliceJohnson>`, `<${EX}personName>`, `"Alice Johnson"`],
  [`<${EX}person/BobSmith>`, `<${EX}personName>`, `"Bob Smith"`],
];

for (const [s, p, o] of triples) {
  db.add_triple(s, p, o);
}

console.log(`Loaded ${db.triple_count()} triples.\n`);

// Helper: format SPARQL results
function printResults(label, result) {
  console.log(`--- ${label} ---`);
  if (result.bindings) {
    for (const row of result.bindings) {
      const formatted = {};
      for (const [k, v] of Object.entries(row)) {
        formatted[k] = v.value || v;
      }
      console.log("  ", JSON.stringify(formatted));
    }
  } else {
    console.log("  ", JSON.stringify(result));
  }
  console.log();
}

// --- Query all grant titles ---
printResults("All grant titles", db.sparql(`
  SELECT ?grant ?title WHERE {
    ?grant <${EX}hasTitle> ?title
  }
`));

// --- Find grants by sponsor (Alice) ---
printResults("Grants by Alice Johnson", db.sparql(`
  SELECT ?grant ?title WHERE {
    ?grant <${EX}hasSponsor> <${EX}person/AliceJohnson> .
    ?grant <${EX}hasTitle> ?title
  }
`));

// --- Find department names ---
printResults("All departments", db.sparql(`
  SELECT ?dept ?name WHERE {
    ?dept <${EX}deptName> ?name
  }
`));

// --- G002 title ---
printResults("G002 title", db.sparql(`
  SELECT ?title WHERE {
    <${EX}grant/G002> <${EX}hasTitle> ?title
  }
`));

// --- G002 budget ---
printResults("G002 budget", db.sparql(`
  SELECT ?budget WHERE {
    <${EX}grant/G002> <${EX}hasBudget> ?budget
  }
`));

// --- People ---
printResults("People", db.sparql(`
  SELECT ?person ?name WHERE {
    ?person <${EX}personName> ?name
  }
`));
