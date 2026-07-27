import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(
  process.cwd(),
  "certification-reports",
);
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(
    dir,
    "level-up-runtime-v5.114B.json",
  ),
  JSON.stringify(
    {
      package: "v5.114B",
      domain: "level-up-progression",
      generatedAt: new Date().toISOString(),
      runtime:
        "src/core/rulesets/levelUpProgressionRules.ts",
      coverage: [
        "level 1-20 clamp",
        "proficiency bonus",
        "ASI progression",
        "fighter extra ASI",
        "rogue extra ASI",
        "2014 subclass unlock",
        "2024 subclass unlock",
        "HP gain",
        "multiclass total level",
        "spell tier",
        "cantrip tier",
        "single-class level-up mutation",
        "milestone summary",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Level-up runtime report generated.");
