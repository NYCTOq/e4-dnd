import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "certification",
  "player-readiness",
  "guidedFeatureAutomationWave1-v6.2D2.test.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

const typeAnchor = `type RuntimeEngine =
  | "damage"
  | "defense"
  | "healing"
  | "resource"
  | "advantage"
  | "rest"
  | "guidance";`;

const typedBlock = `type RuntimeEngine =
  | "damage"
  | "defense"
  | "healing"
  | "resource"
  | "advantage"
  | "rest"
  | "guidance";

type AutomationEntry = {
  ruleset: RulesetId;
  className: string;
  subclassId: string;
  subclassName: string;
  featureName: string;
  featureLevel: number | null;
  engine: RuntimeEngine;
  runtimeContract: string;
  playModeAction: string;
  persistenceKey: string;
  blockers: string[];
  status: "ready" | "blocked";
};`;

if (!source.includes(typedBlock)) {
  if (!source.includes(typeAnchor)) {
    throw new Error("RuntimeEngine type anchor not found.");
  }
  source = source.replace(typeAnchor, typedBlock);
}

source = source.replace(
  "  const entries = [];",
  "  const entries: AutomationEntry[] = [];",
);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  automationEntryTypeInstalled: source.includes("type AutomationEntry = {"),
  entriesExplicitlyTyped: source.includes("const entries: AutomationEntry[] = [];"),
}, null, 2));
