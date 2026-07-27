import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "rest-ui-component-persistence-v5.111D2.json"),
  JSON.stringify(
    {
      package: "v5.111D2",
      generatedAt: new Date().toISOString(),
      component: "src/components/rest/RestActionsPanel.tsx",
      persistenceBridge:
        "src/core/rulesets/restRecoveryPersistenceBridge.ts",
      testIds: [
        "rest-actions-panel",
        "rest-short-button",
        "rest-long-button",
        "rest-result",
      ],
      next: "contract-driven page wiring and desktop/mobile E2E",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log("Rest UI component/persistence report generated.");
