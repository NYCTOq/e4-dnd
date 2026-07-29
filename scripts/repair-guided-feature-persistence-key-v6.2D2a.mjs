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

const oldLoop = `    for (const feature of subclass.features ?? []) {
      const name = featureName(feature);
      const level = featureLevel(feature);
      const engine = routeFeature(feature);
      const featureBlockers: string[] = [];`;

const newLoop = `    for (const [featureIndex, feature] of (subclass.features ?? []).entries()) {
      const name = featureName(feature);
      const level = featureLevel(feature);
      const engine = routeFeature(feature);
      const featureBlockers: string[] = [];`;

const oldKey = `        persistenceKey: [
          ruleset,
          subclass.id,
          name || "unknown-feature",
        ]
          .join(":")
          .toLowerCase()
          .replace(/[^a-z0-9:_-]+/g, "-"),`;

const newKey = `        persistenceKey: [
          ruleset,
          subclass.id,
          String(level ?? "unknown-level"),
          String(featureIndex),
          name || "unknown-feature",
        ]
          .join(":")
          .toLowerCase()
          .replace(/[^a-z0-9:_-]+/g, "-"),`;

if (!source.includes(oldLoop) && !source.includes(newLoop)) {
  throw new Error("Subclass feature loop not found.");
}

if (!source.includes(oldKey) && !source.includes(newKey)) {
  throw new Error("Persistence key block not found.");
}

source = source.replace(oldLoop, newLoop);
source = source.replace(oldKey, newKey);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  featureIndexIncluded: source.includes("featureIndex"),
  featureLevelIncluded: source.includes('String(level ?? "unknown-level")'),
}, null, 2));
