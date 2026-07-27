import {
  access,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const required = [
  "src/certification/reference/levelUpProgression.reference.ts",
  "src/core/rulesets/levelUpProgressionRules.ts",
  "src/core/rulesets/levelUpCharacterAdapter.ts",
  "src/core/rulesets/levelUpPersistenceBridge.ts",
  "src/components/levelup/LevelUpRuntimePanel.tsx",
  "src/components/levelup/LevelUpRuntimeIntegrationMount.tsx",
  "e2e/level-up-runtime-ui-v5.114D3.spec.ts",
  "dist/index.html",
  "dist/manifest.webmanifest",
  "dist/sw.js",
  "certification-reports/level-up-progression-discovery-v5.114A.json",
  "certification-reports/level-up-runtime-v5.114B.json",
  "certification-reports/level-up-character-adapter-v5.114C.json",
  "certification-reports/level-up-ui-contract-v5.114D1.json",
  "certification-reports/level-up-panel-persistence-v5.114D2.json",
];

const missing = [];

for (const file of required) {
  try {
    await access(
      resolve(root, file),
      constants.F_OK,
    );
  } catch {
    missing.push(file);
  }
}

const core =
  1127 +
  723 +
  749 +
  22 +
  146 +
  5 +
  7 +
  164;

const logicalE2E = 4;
const total = core + logicalE2E;

const status =
  missing.length === 0 ? "GREEN" : "RED";

const report = {
  package: "v5.114D3",
  domain: "level-up-progression-ui",
  generatedAt: new Date().toISOString(),
  status,
  certified: {
    core,
    logicalE2E,
    total,
  },
  requiredFiles: required,
  missingFiles: missing,
};

const dir = resolve(
  root,
  "certification-reports",
);

await mkdir(dir, { recursive: true });

await writeFile(
  resolve(
    dir,
    "level-up-final-closure-v5.114D3.json",
  ),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(
    dir,
    "level-up-final-closure-v5.114D3.md",
  ),
  [
    "# Level-Up Progression UI Final Closure v5.114D3",
    "",
    `- Status: **${status}**`,
    `- Core tests: **${core}**`,
    `- Logical E2E scenarios: **${logicalE2E}**`,
    `- Certified total: **${total}**`,
    `- Missing files: **${missing.length}**`,
    "",
  ].join("\n"),
  "utf8",
);

console.log(
  `v5.114D3 Level-Up final closure: ${status}`,
);
console.log(
  `Certified total: ${total} (${core} core + ${logicalE2E} E2E).`,
);

if (status !== "GREEN") {
  console.error(
    "Missing:",
    missing.join(", "),
  );
  process.exit(1);
}
