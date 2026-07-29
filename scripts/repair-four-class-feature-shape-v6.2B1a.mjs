import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "certification",
  "player-readiness",
  "fourClassPlayerReadiness-v6.2B1.test.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

if (!source.includes("function featureName(")) {
  const marker = "function expectedLevels(): number[] {";
  const helper = `function featureName(feature: unknown): string {
  if (typeof feature === "string") return feature;
  if (
    feature &&
    typeof feature === "object" &&
    "name" in feature &&
    typeof (feature as { name?: unknown }).name === "string"
  ) {
    return (feature as { name: string }).name;
  }
  return "";
}

`;

  if (!source.includes(marker)) {
    throw new Error("Insertion marker not found.");
  }

  source = source.replace(marker, helper + marker);
}

source = source.replaceAll(
  'feature.name.toLowerCase().includes("extra attack")',
  'featureName(feature).toLowerCase().includes("extra attack")',
);

source = source.replaceAll(
  'feature.name.toLowerCase().includes("sneak attack")',
  'featureName(feature).toLowerCase().includes("sneak attack")',
);

fs.writeFileSync(filePath, source, "utf8");

console.log(
  JSON.stringify(
    {
      path: path.relative(process.cwd(), filePath),
      helperInstalled: source.includes("function featureName("),
      fighterGuardRepaired: source.includes(
        'featureName(feature).toLowerCase().includes("extra attack")',
      ),
      rogueGuardRepaired: source.includes(
        'featureName(feature).toLowerCase().includes("sneak attack")',
      ),
    },
    null,
    2,
  ),
);
