import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { basename, extname, relative, resolve } from "node:path";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const e2eRoot = resolve(root, "e2e");
const reportDir = resolve(root, "certification-reports");

const includeExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const excludedDirs = new Set([
  "node_modules",
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
  ".git",
]);

async function walk(dir) {
  const result = [];

  try {
    for (const name of await readdir(dir)) {
      const full = resolve(dir, name);
      const info = await stat(full);

      if (info.isDirectory()) {
        if (!excludedDirs.has(name)) {
          result.push(...(await walk(full)));
        }
        continue;
      }

      if (includeExtensions.has(extname(name))) {
        result.push(full);
      }
    }
  } catch {
    return [];
  }

  return result;
}

const sourceFiles = await walk(srcRoot);
const e2eFiles = await walk(e2eRoot);
const allFiles = [...sourceFiles, ...e2eFiles];

const targetSignals = {
  restCenter: [
    "RestCenterPage",
    "Rest Center",
    "short rest",
    "long rest",
    "hit dice",
  ],
  characterDetail: [
    "CharacterDetail",
    "character detail",
    "currentHp",
    "maxHp",
  ],
  routing: [
    "createBrowserRouter",
    "createHashRouter",
    "Routes",
    "Route",
    "useNavigate",
    "router",
  ],
  storage: [
    "localStorage",
    "sessionStorage",
    "saveCharacter",
    "updateCharacter",
    "setCharacters",
    "characterStorage",
    "safeStorage",
  ],
  testing: [
    "data-testid",
    "getByTestId",
    "getByRole",
    "installKnownAppState",
    "seedCharacters",
  ],
};

function lineNumberAt(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function collectMatches(content, signals) {
  const lower = content.toLowerCase();
  const matches = [];

  for (const signal of signals) {
    let from = 0;
    const needle = signal.toLowerCase();

    while (true) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;

      matches.push({
        signal,
        line: lineNumberAt(content, index),
      });

      from = index + needle.length;
    }
  }

  return matches;
}

function extractTestIds(content) {
  const ids = new Set();
  const patterns = [
    /data-testid\s*=\s*["']([^"']+)["']/g,
    /getByTestId\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      ids.add(match[1]);
    }
  }

  return [...ids].sort();
}

function extractRoutes(content) {
  const routes = new Set();
  const patterns = [
    /path\s*:\s*["']([^"']+)["']/g,
    /path\s*=\s*["']([^"']+)["']/g,
    /navigate\(\s*["']([^"']+)["']/g,
    /to\s*=\s*["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1].startsWith("/")) {
        routes.add(match[1]);
      }
    }
  }

  return [...routes].sort();
}

function extractExportedSymbols(content) {
  const symbols = new Set();
  const patterns = [
    /\bexport\s+(?:default\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /\bexport\s+const\s+([A-Za-z0-9_$]+)\s*=/g,
    /\bexport\s+class\s+([A-Za-z0-9_$]+)/g,
    /\bexport\s+default\s+([A-Za-z0-9_$]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      symbols.add(match[1]);
    }
  }

  return [...symbols].sort();
}

function excerpt(content, centerLine, radius = 4) {
  const lines = content.split(/\r?\n/);
  const start = Math.max(0, centerLine - radius - 1);
  const end = Math.min(lines.length, centerLine + radius);

  return {
    startLine: start + 1,
    endLine: end,
    text: lines.slice(start, end).join("\n"),
  };
}

const findings = [];

for (const file of allFiles) {
  const content = await readFile(file, "utf8");
  const categories = {};

  for (const [category, signals] of Object.entries(targetSignals)) {
    const matches = collectMatches(content, signals);
    if (matches.length > 0) {
      categories[category] = matches;
    }
  }

  if (Object.keys(categories).length === 0) continue;

  const highestSignal = Object.values(categories)
    .flat()
    .sort((a, b) => a.line - b.line)[0];

  findings.push({
    file: relative(root, file).replaceAll("\\", "/"),
    basename: basename(file),
    categories,
    testIds: extractTestIds(content),
    routes: extractRoutes(content),
    exportedSymbols: extractExportedSymbols(content),
    excerpt: excerpt(content, highestSignal.line),
    lineCount: content.split(/\r?\n/).length,
  });
}

function score(finding, category) {
  const categoryMatches = finding.categories[category] ?? [];
  let result = categoryMatches.length * 10;

  const fileLower = finding.file.toLowerCase();
  if (category === "restCenter" && fileLower.includes("restcenter")) result += 100;
  if (category === "characterDetail" && fileLower.includes("characterdetail")) result += 100;
  if (category === "routing" && (fileLower.includes("router") || fileLower.includes("app."))) result += 40;
  if (category === "storage" && fileLower.includes("storage")) result += 60;
  if (finding.testIds.length > 0) result += finding.testIds.length * 2;

  return result;
}

function topFor(category, limit = 10) {
  return findings
    .filter((finding) => finding.categories[category])
    .sort((a, b) => score(b, category) - score(a, category))
    .slice(0, limit);
}

const contract = {
  package: "v5.111D1",
  domain: "rest-ui-integration",
  generatedAt: new Date().toISOString(),
  scannedFiles: allFiles.length,
  matchedFiles: findings.length,
  candidates: {
    restCenter: topFor("restCenter"),
    characterDetail: topFor("characterDetail"),
    routing: topFor("routing"),
    storage: topFor("storage"),
    testing: topFor("testing"),
  },
  consolidated: {
    testIds: [...new Set(findings.flatMap((finding) => finding.testIds))].sort(),
    routes: [...new Set(findings.flatMap((finding) => finding.routes))].sort(),
    exportedSymbols: [
      ...new Set(findings.flatMap((finding) => finding.exportedSymbols)),
    ].sort(),
  },
  requiredRuntimeFiles: [
    "src/core/rulesets/restRecoveryRules.ts",
    "src/core/rulesets/restRecoveryCharacterAdapter.ts",
  ],
};

const missingRuntimeFiles = [];

for (const file of contract.requiredRuntimeFiles) {
  try {
    await access(resolve(root, file), constants.F_OK);
  } catch {
    missingRuntimeFiles.push(file);
  }
}

contract.missingRuntimeFiles = missingRuntimeFiles;
contract.status =
  missingRuntimeFiles.length === 0 &&
  contract.candidates.restCenter.length > 0 &&
  contract.candidates.characterDetail.length > 0 &&
  contract.candidates.storage.length > 0
    ? "READY"
    : "NEEDS_REVIEW";

await mkdir(reportDir, { recursive: true });

await writeFile(
  resolve(reportDir, "rest-ui-integration-contract-v5.111D1.json"),
  JSON.stringify(contract, null, 2) + "\n",
  "utf8",
);

const markdown = [
  "# Rest UI Integration Contract v5.111D1",
  "",
  `- Status: **${contract.status}**`,
  `- Scanned files: **${contract.scannedFiles}**`,
  `- Matched files: **${contract.matchedFiles}**`,
  `- Rest Center candidates: **${contract.candidates.restCenter.length}**`,
  `- Character Detail candidates: **${contract.candidates.characterDetail.length}**`,
  `- Storage candidates: **${contract.candidates.storage.length}**`,
  `- Router candidates: **${contract.candidates.routing.length}**`,
  `- Test IDs found: **${contract.consolidated.testIds.length}**`,
  "",
  "## Highest-signal Rest Center files",
  "",
  ...contract.candidates.restCenter.slice(0, 5).map(
    (item) => `- \`${item.file}\` — exports: ${item.exportedSymbols.join(", ") || "none"}`,
  ),
  "",
  "## Highest-signal Character Detail files",
  "",
  ...contract.candidates.characterDetail.slice(0, 5).map(
    (item) => `- \`${item.file}\` — exports: ${item.exportedSymbols.join(", ") || "none"}`,
  ),
  "",
  "## Highest-signal Storage files",
  "",
  ...contract.candidates.storage.slice(0, 5).map(
    (item) => `- \`${item.file}\` — exports: ${item.exportedSymbols.join(", ") || "none"}`,
  ),
  "",
  "## Routes",
  "",
  ...contract.consolidated.routes.map((route) => `- \`${route}\``),
  "",
  "## Test IDs",
  "",
  ...contract.consolidated.testIds.map((id) => `- \`${id}\``),
  "",
].join("\n");

await writeFile(
  resolve(reportDir, "rest-ui-integration-contract-v5.111D1.md"),
  markdown,
  "utf8",
);

console.log(`Rest UI integration discovery: ${contract.status}`);
console.log(`Matched files: ${contract.matchedFiles}`);
console.log(
  "Report: certification-reports/rest-ui-integration-contract-v5.111D1.json",
);
