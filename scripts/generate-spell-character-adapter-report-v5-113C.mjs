import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "spell-character-adapter-v5.113C.json"),
  JSON.stringify(
    {
      package: "v5.113C",
      generatedAt: new Date().toISOString(),
      adapter:
        "src/core/rulesets/spellCharacterCombatAdapter.ts",
      goldenCasters: [
        "wizard",
        "cleric",
        "warlock",
        "sorcerer",
        "druid",
        "paladin",
      ],
      coverage: [
        "casting ability resolution",
        "spell save DC",
        "spell attack bonus",
        "normal spell slots",
        "pact spell slots",
        "cantrip casting",
        "concentration persistence",
        "damage target persistence",
        "healing target persistence",
        "legacy migration",
        "homebrew spell preservation",
        "JSON round trip",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Spell character adapter report generated.");
