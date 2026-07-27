import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "spell-runtime-combat-v5.113B.json"),
  JSON.stringify(
    {
      package: "v5.113B",
      domain: "spell-runtime-combat",
      generatedAt: new Date().toISOString(),
      runtime:
        "src/core/rulesets/spellRuntimeCombatRules.ts",
      coverage: [
        "spell save DC",
        "spell attack bonus",
        "cantrip scaling",
        "upcast",
        "slot consume/restore",
        "damage relations",
        "saving throw damage",
        "healing",
        "concentration",
        "slot availability",
        "target limits",
        "damage pipeline",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Spell runtime combat report generated.");
