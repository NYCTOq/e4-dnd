import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "level-up-character-adapter-v5.114C.json"),
  JSON.stringify(
    {
      package: "v5.114C",
      domain: "level-up-progression",
      generatedAt: new Date().toISOString(),
      adapter:
        "src/core/rulesets/levelUpCharacterAdapter.ts",
      coverage: [
        "single-class level-up",
        "multiclass selected class level-up",
        "HP gain",
        "current HP preservation",
        "proficiency bonus refresh",
        "cantrip tier refresh",
        "spell tier refresh",
        "ASI ability increase",
        "feat selection",
        "subclass pending choice",
        "level-up history",
        "legacy migration",
        "homebrew preservation",
        "JSON round-trip",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Level-up character adapter report generated.");
