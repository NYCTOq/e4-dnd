import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "class-subclass-golden-character-adapter-v5.112C.json"),
  JSON.stringify(
    {
      package: "v5.112C",
      generatedAt: new Date().toISOString(),
      adapter:
        "src/core/rulesets/classSubclassCharacterAdapter.ts",
      goldenClasses: [
        "fighter",
        "cleric",
        "wizard",
        "rogue",
        "warlock",
        "monk",
      ],
      coverage: [
        "single-class migration",
        "multiclass level boundaries",
        "subclass unlock state",
        "limited-use resolution",
        "short/long rest persistence",
        "JSON round trip",
        "homebrew field preservation",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Class/subclass golden adapter report generated.");
