import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const roots = [
  resolve(root, "src"),
  resolve(root, "e2e"),
];

const ignored = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  "test-results",
  "playwright-report",
]);

const allowed = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function walk(dir) {
  const files = [];

  try {
    for (const entry of await readdir(dir)) {
      const full = resolve(dir, entry);
      const info = await stat(full);

      if (info.isDirectory()) {
        if (!ignored.has(entry)) {
          files.push(...(await walk(full)));
        }
      } else if (allowed.has(extname(entry))) {
        files.push(full);
      }
    }
  } catch {
    return files;
  }

  return files;
}

const files = (await Promise.all(roots.map(walk))).flat();

const categories = {
  characterDetail: [
    "CharacterDetail",
    "character detail",
    "classFeatures",
    "subclassId",
    "features",
  ],
  playMode: [
    "PlayMode",
    "play mode",
    "actions",
    "bonus actions",
    "reactions",
    "resources",
  ],
  classCatalog: [
    "ClassCatalog",
    "SubclassCatalog",
    "classExpansion",
    "subclassExpansion",
  ],
  storage: [
    "localStorage",
    "saveCharacter",
    "updateCharacter",
    "setCharacters",
    "characters_list",
    "safeStorage",
  ],
  routing: [
    "Route",
    "path:",
    "navigate(",
    "useNavigate",
    "createBrowserRouter",
  ],
  testing: [
    "data-testid",
    "getByTestId",
    "getByRole",
    "page.goto",
  ],
};

function extractMatches(content, signals) {
  const lower = content.toLowerCase();
  return signals
    .map((signal) => ({
      signal,
      count: lower.split(signal.toLowerCase()).length - 1,
    }))
    .filter((entry) => entry.count > 0);
}

function extractTestIds(content) {
  const result = new Set();
  for (const pattern of [
    /data-testid\s*=\s*["']([^"']+)["']/g,
    /getByTestId\(\s*["']([^"']+)["']\s*\)/g,
  ]) {
    for (const match of content.matchAll(pattern)) {
      result.add(match[1]);
    }
  }
  return [...result].sort();
}

function extractRoutes(content) {
  const result = new Set();
  for (const pattern of [
    /path\s*:\s*["']([^"']+)["']/g,
    /path\s*=\s*["']([^"']+)["']/g,
    /navigate\(\s*["']([^"']+)["']/g,
    /to\s*=\s*["']([^"']+)["']/g,
  ]) {
    for (const match of content.matchAll(pattern)) {
      if (match[1].startsWith("/")) result.add(match[1]);
    }
  }
  return [...result].sort();
}

function extractExports(content) {
  return [
    ...new Set(
      [...content.matchAll(
        /\bexport\s+(?:default\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_$]+)/g,
      )].map((match) => match[1]),
    ),
  ].sort();
}

const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const matches = {};

  for (const [category, signals] of Object.entries(categories)) {
    const categoryMatches = extractMatches(content, signals);
    if (categoryMatches.length > 0) {
      matches[category] = categoryMatches;
    }
  }

  if (Object.keys(matches).length === 0) continue;

  findings.push({
    file: relative(root, file).replaceAll("\\", "/"),
    matches,
    testIds: extractTestIds(content),
    routes: extractRoutes(content),
    exports: extractExports(content),
    lineCount: content.split(/\r?\n/).length,
  });
}

function score(item, category) {
  const signalScore = (item.matches[category] ?? [])
    .reduce((sum, match) => sum + match.count * 10, 0);

  const file = item.file.toLowerCase();
  let bonus = 0;

  if (category === "characterDetail" && file.includes("characterdetail")) bonus += 100;
  if (category === "playMode" && file.includes("playmode")) bonus += 100;
  if (category === "classCatalog" && /class|subclass/.test(file)) bonus += 60;
  if (category === "storage" && file.includes("storage")) bonus += 60;
  if (category === "testing" && file.startsWith("e2e/")) bonus += 50;

  return signalScore + bonus + item.testIds.length * 2;
}

function top(category, limit = 15) {
  return findings
    .filter((item) => item.matches[category])
    .sort((a, b) => score(b, category) - score(a, category))
    .slice(0, limit);
}

const required = [
  "src/core/rulesets/classSubclassRuntimeRules.ts",
  "src/core/rulesets/classSubclassCharacterAdapter.ts",
];

const missingRequired = [];

for (const file of required) {
  try {
    await access(resolve(root, file), constants.F_OK);
  } catch {
    missingRequired.push(file);
  }
}

const report = {
  package: "v5.112D1",
  domain: "class-subclass-ui-integration",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: findings.length,
  requiredRuntimeFiles: required,
  missingRequired,
  candidates: {
    characterDetail: top("characterDetail"),
    playMode: top("playMode"),
    classCatalog: top("classCatalog"),
    storage: top("storage"),
    routing: top("routing"),
    testing: top("testing"),
  },
  consolidated: {
    testIds: [...new Set(findings.flatMap((item) => item.testIds))].sort(),
    routes: [...new Set(findings.flatMap((item) => item.routes))].sort(),
    exports: [...new Set(findings.flatMap((item) => item.exports))].sort(),
  },
};

report.status =
  missingRequired.length === 0 &&
  report.candidates.characterDetail.length > 0 &&
  report.candidates.playMode.length > 0 &&
  report.candidates.storage.length > 0
    ? "READY"
    : "NEEDS_REVIEW";

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "class-subclass-ui-contract-v5.112D1.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(dir, "class-subclass-ui-contract-v5.112D1.md"),
  [
    "# Class/Subclass UI Integration Contract v5.112D1",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    `- Character Detail candidates: **${report.candidates.characterDetail.length}**`,
    `- Play Mode candidates: **${report.candidates.playMode.length}**`,
    `- Storage candidates: **${report.candidates.storage.length}**`,
    `- Test IDs: **${report.consolidated.testIds.length}**`,
    "",
    "## Character Detail",
    "",
    ...report.candidates.characterDetail.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Play Mode",
    "",
    ...report.candidates.playMode.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Storage",
    "",
    ...report.candidates.storage.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Class/Subclass UI discovery: ${report.status}`);
console.log(`Matched files: ${report.matchedFiles}`);
console.log("Report: certification-reports/class-subclass-ui-contract-v5.112D1.json");
