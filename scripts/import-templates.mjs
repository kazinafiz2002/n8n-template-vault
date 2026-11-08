// Bulk import from your computer:  node scripts/import-templates.mjs ./my-templates
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (or the environment).
// Sub-folder names become categories (e.g. ./my-templates/Marketing/foo.json → "Marketing").
import fs from "node:fs";
import path from "node:path";
import { processWorkflowFile } from "../lib/workflow.mjs";

for (const f of [".env.local", ".env"]) {
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const root = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!root || !url || !key) {
  console.error("Usage: node scripts/import-templates.mjs <folder>\nSet NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(json|txt)$/i.test(e.name) ? [p] : [];
  });
}

const files = walk(root);
console.log(`Found ${files.length} files`);
let inserted = 0, skipped = 0, failed = 0, batch = [];

async function flush() {
  if (!batch.length) return;
  const res = await fetch(`${url}/rest/v1/rpc/admin_import_templates`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: batch }),
  });
  if (!res.ok) { console.error("Batch failed:", await res.text()); failed += batch.length; }
  else { const r = await res.json(); inserted += r.inserted; skipped += r.skipped; }
  batch = [];
  process.stdout.write(`\rinserted ${inserted} · duplicates ${skipped} · failed ${failed}`);
}

for (const file of files) {
  const rel = path.relative(root, file).split(path.sep);
  const folder = rel.length > 1 ? rel[rel.length - 2] : undefined;
  const r = processWorkflowFile(fs.readFileSync(file, "utf8"), path.basename(file), folder);
  if (!r.ok) { failed++; console.error(`\n${file}: ${r.error}`); continue; }
  batch.push(r.item);
  if (batch.length >= 50) await flush();
}
await flush();
console.log("\nDone.");
