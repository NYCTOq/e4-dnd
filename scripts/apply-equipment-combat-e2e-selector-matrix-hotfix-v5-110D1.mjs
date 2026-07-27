import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const specPath = resolve(
  projectRoot,
  "e2e/equipment-combat-certification.spec.ts",
);

let source = await readFile(specPath, "utf8");

source = source.replace(
  'page.getByRole("heading", { name: "Golden Shield Fighter" })',
  'page.getByRole("heading", { name: "Golden Shield Fighter", level: 1 })',
);

source = source.replace(
  'page.getByRole("heading", { name: "Golden Fire Bolt Wizard" })',
  'page.getByRole("heading", { name: "Golden Fire Bolt Wizard", level: 1 })',
);

const loopStart = source.indexOf(
  'for (const viewport of ["desktop", "mobile"] as const) {',
);

if (loopStart < 0) {
  throw new Error("Desktop/mobile iç döngüsü bulunamadı.");
}

const bodyStart = source.indexOf(
  'test("fighter loadout renders inventory and combat data"',
  loopStart,
);

if (bodyStart < 0) {
  throw new Error("Fighter E2E testi bulunamadı.");
}

const wizardStart = source.indexOf(
  'test("spellcaster readiness renders offensive option"',
  bodyStart,
);

if (wizardStart < 0) {
  throw new Error("Wizard E2E testi bulunamadı.");
}

function findTestEnd(text, start) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let seenOpen = false;

  for (let i = start; i < text.length; i += 1) {
    const c = text[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = null;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }

    if (c === "(" || c === "{" || c === "[") {
      depth += 1;
      seenOpen = true;
    } else if (c === ")" || c === "}" || c === "]") {
      depth -= 1;
    }

    if (seenOpen && depth === 0 && c === ";") {
      return i + 1;
    }
  }

  throw new Error("Test bloğu sonu bulunamadı.");
}

const fighterEnd = findTestEnd(source, bodyStart);
const wizardEnd = findTestEnd(source, wizardStart);

const fighterBlock = source.slice(bodyStart, fighterEnd);
const wizardBlock = source.slice(wizardStart, wizardEnd);

source =
  source.slice(0, loopStart) +
  fighterBlock +
  "\n\n" +
  wizardBlock +
  "\n";

await writeFile(specPath, source, "utf8");

const packagePath = resolve(projectRoot, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.110.9";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.110D1 E2E selector ve proje matrisi düzeltildi.");
