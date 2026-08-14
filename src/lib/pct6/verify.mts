/**
 * Standalone parity check: decode the sample .pct6 with our TS port and diff
 * the result against the JSON the reference Python decoder produced.
 * Run with:  npx tsx src/lib/pct6/verify.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decodePct6 } from "./decode.ts";

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, "__fixtures__", "sample-tune.pct6"));
const expected = JSON.parse(
  readFileSync(join(here, "__fixtures__", "sample-tune.expected.json"), "utf-8"),
);

const got = decodePct6(raw, "sample-tune.pct6");

// The Python tool stamps "pct6_extract.py vX"; ours stamps ".ts". Ignore that.
const norm = (o: unknown) => {
  const s = JSON.stringify(o, (k, v) => (k === "decoder" ? "DECODER" : v), 2);
  return s;
};

const a = norm(expected);
const b = norm(got);

if (a === b) {
  console.log("PASS — TS decoder output matches the reference JSON exactly.");
  console.log(
    `  ${got.outputs.length} outputs, ${got.inputs.length} inputs, container: ${got.container_mode}`,
  );
  process.exit(0);
}

// Find the first differing line to make failures actionable.
const al = a.split("\n");
const bl = b.split("\n");
for (let i = 0; i < Math.max(al.length, bl.length); i++) {
  if (al[i] !== bl[i]) {
    console.error(`FAIL — first difference at line ${i + 1}:`);
    console.error(`  expected: ${al[i]}`);
    console.error(`  got:      ${bl[i]}`);
    break;
  }
}
process.exit(1);
