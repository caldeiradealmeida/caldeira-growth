// Verifies the production build (run `npm run build` first) never leaks a
// sensitive server-side key into the client bundle, and that the CRM module
// (which pulls in @supabase/supabase-js) is isolated to its own lazy chunk
// instead of inflating the public site's main bundle.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const distAssets = join(process.cwd(), "dist", "assets");
const files = readdirSync(distAssets).filter((f) => f.endsWith(".js"));

const FORBIDDEN_PATTERNS = [/SUPABASE_SERVICE_ROLE_KEY/i, /service_role/i];

let failed = false;

for (const file of files) {
  const content = readFileSync(join(distAssets, file), "utf8");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`FAIL: ${file} matches forbidden pattern ${pattern}`);
      failed = true;
    }
  }
}

const indexFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const crmFile = files.find((f) => f.startsWith("CrmApp-") && f.endsWith(".js"));

if (!crmFile) {
  console.error("FAIL: no CrmApp-*.js chunk found -- lazy loading may be broken");
  failed = true;
} else if (indexFile) {
  const indexContent = readFileSync(join(distAssets, indexFile), "utf8");
  if (/createClient/.test(indexContent) && /@supabase\/supabase-js/.test(indexContent)) {
    console.error(`FAIL: ${indexFile} appears to bundle @supabase/supabase-js directly (lazy split broken)`);
    failed = true;
  }
}

if (failed) {
  console.error("\ncheck-crm-bundle-safety: FAILED");
  process.exit(1);
}

console.log(`check-crm-bundle-safety: OK (${files.length} chunks scanned, CRM isolated in ${crmFile})`);
