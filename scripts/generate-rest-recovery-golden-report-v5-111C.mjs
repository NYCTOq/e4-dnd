import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "rest-recovery-golden-character-integration-v5.111C.json"),
  JSON.stringify(
    {
      package: "v5.111C",
      domain: "rest-recovery-character-integration",
      generatedAt: new Date().toISOString(),
      adapter:
        "src/core/rulesets/restRecoveryCharacterAdapter.ts",
      goldenClasses: [
        "fighter",
        "wizard",
        "warlock",
        "monk",
        "cleric",
      ],
      coverage: [
        "legacy migration",
        "character-to-runtime adapter",
        "runtime-to-character adapter",
        "short rest persistence",
        "long rest persistence",
        "JSON import/export round trip",
        "unknown field preservation",
        "2014/2024 ruleset preservation",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Rest/recovery golden integration report generated.");
