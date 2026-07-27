import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "class-subclass-runtime-v5.112B.json"),
  JSON.stringify(
    {
      package: "v5.112B",
      domain: "class-subclass-runtime",
      generatedAt: new Date().toISOString(),
      runtime:
        "src/core/rulesets/classSubclassRuntimeRules.ts",
      coverage: [
        "2014 subclass schedules",
        "2024 subclass schedules",
        "feature unlock",
        "class-level boundaries",
        "multiclass total level",
        "limited uses",
        "resource recovery",
        "activation normalization",
        "malformed feature normalization",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Class/subclass runtime report generated.");
