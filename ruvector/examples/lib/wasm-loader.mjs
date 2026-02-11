/**
 * WASM loader for Node.js environments.
 * Reads the .wasm binary from disk and passes it to init().
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Initialize @ruvector/rvlite for Node.js.
 * Returns all named exports from the WASM module.
 */
export async function initRvlite() {
  const mod = await import("@ruvector/rvlite");
  const init = mod.default;

  // Resolve the .wasm file path via import.meta.resolve
  const modUrl = import.meta.resolve("@ruvector/rvlite");
  const modPath = fileURLToPath(modUrl);
  const wasmPath = join(dirname(modPath), "rvlite_bg.wasm");
  const wasmBytes = readFileSync(wasmPath);

  await init(wasmBytes);
  return mod;
}
