import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "class-feature-panel-persistence-v5.112D2.json"),
  JSON.stringify(
    {
      package: "v5.112D2",
      generatedAt: new Date().toISOString(),
      component:
        "src/components/classFeatures/ClassFeaturePanel.tsx",
      persistenceBridge:
        "src/core/rulesets/classFeaturePersistenceBridge.ts",
      fixedTestIds: [
        "class-feature-panel",
        "class-feature-empty",
      ],
      dynamicTestIds: [
        "class-feature-<id>",
        "class-feature-uses-<id>",
        "class-feature-spend-<id>",
        "class-feature-restore-<id>",
      ],
      next: "contract-driven Character Detail / Play Mode wiring and E2E",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Class feature panel/persistence report generated.");
