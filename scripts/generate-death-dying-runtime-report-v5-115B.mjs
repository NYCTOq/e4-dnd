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
    "death-dying-runtime-v5.115B.json",
  ),
  JSON.stringify(
    {
      package: "v5.115B",
      domain: "death-dying",
      generatedAt: new Date().toISOString(),
      runtime:
        "src/core/rulesets/deathDyingRuntimeRules.ts",
      coverage: [
        "death save count clamp",
        "death save roll classification",
        "natural 1",
        "natural 20",
        "three successes",
        "three failures",
        "damage at zero HP",
        "critical damage at zero HP",
        "massive damage death",
        "stabilize",
        "heal from zero",
        "death save reset",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(
  "Death & Dying runtime report generated.",
);
