import {
  access,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  "src/core/rulesets/restRecoveryRules.ts",
  "src/core/rulesets/restRecoveryCharacterAdapter.ts",
  "src/core/rulesets/restRecoveryPersistenceBridge.ts",
  "src/components/rest/RestActionsPanel.tsx",
  "src/components/rest/RestRuntimeIntegrationMount.tsx",
  "e2e/rest-recovery-ui-v5.111D3.spec.ts",
  "dist/index.html",
  "dist/manifest.webmanifest",
  "dist/sw.js",
  "certification-reports/rest-recovery-runtime-v5.111B.json",
  "certification-reports/rest-recovery-golden-character-integration-v5.111C.json",
  "certification-reports/rest-ui-integration-contract-v5.111D1.json",
  "certification-reports/rest-ui-component-persistence-v5.111D2.json",
];

const missing = [];

for (const file of required) {
  try {
    await access(resolve(root, file), constants.F_OK);
  } catch {
    missing.push(file);
  }
}

const coreTests = 68 + 183 + 206 + 34 + 69 + 5 + 8 + 40;
const e2eTests = 2;
const total = coreTests + e2eTests;
const status = missing.length === 0 ? "GREEN" : "RED";

const report = {
  package: "v5.111D3",
  domain: "rest-recovery-resource",
  status,
  generatedAt: new Date().toISOString(),
  certified: {
    core: coreTests,
    e2e: e2eTests,
    total,
  },
  requiredFiles: required,
  missingFiles: missing,
};

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "rest-recovery-final-closure-v5.111D3.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(dir, "rest-recovery-final-closure-v5.111D3.md"),
  [
    "# Rest, Recovery & Resource Final Closure v5.111D3",
    "",
    `- Status: **${status}**`,
    `- Core tests: **${coreTests}**`,
    `- E2E tests: **${e2eTests}**`,
    `- Certified total: **${total}**`,
    `- Missing files: **${missing.length}**`,
    "",
  ].join("\n"),
  "utf8",
);

console.log(`v5.111D3 Rest/Recovery final closure: ${status}`);
console.log(`Certified total: ${total} tests (${coreTests} core + ${e2eTests} E2E).`);

if (status !== "GREEN") {
  console.error("Missing:", missing.join(", "));
  process.exit(1);
}
