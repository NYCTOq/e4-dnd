import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "certification",
  "player-readiness",
  "originFeatRuntimeMatrix-v6.2C7.test.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error(`Target file not found: ${filePath}`);
}

let source = fs.readFileSync(filePath, "utf8");

const oldBlock = `        epicBoonEligibility:
          level < 19 ||
          Boolean(epicBoon?.id) ||
          classData.levels.some(
            (entry) =>
              entry.level <= level &&
              entry.features.some((feature) =>
                featureName(feature)
                  .toLowerCase()
                  .includes("epic boon"),
              ),
          ),`;

const newBlock = `        epicBoonEligibility:
          ruleset === "dnd_2014" ||
          level < 19 ||
          Boolean(epicBoon?.id) ||
          classData.levels.some(
            (entry) =>
              entry.level <= level &&
              entry.features.some((feature) =>
                featureName(feature)
                  .toLowerCase()
                  .includes("epic boon"),
              ),
          ),`;

if (!source.includes(oldBlock) && !source.includes(newBlock)) {
  throw new Error("Epic Boon eligibility block not found.");
}

source = source.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, source, "utf8");

console.log(JSON.stringify({
  path: path.relative(process.cwd(), filePath),
  rulesetAwareEpicBoon: source.includes('ruleset === "dnd_2014" ||'),
}, null, 2));
