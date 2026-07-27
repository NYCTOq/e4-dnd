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
const scanRoots = [
  resolve(root, "src"),
  resolve(root, "e2e"),
];

const ignored = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  "playwright-report",
  "test-results",
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

const categories = {
  builder: [
    "Builder",
    "CharacterEditor",
    "createCharacter",
    "updateCharacter",
    "character form",
    "classId",
    "ruleset",
  ],
  characterDetail: [
    "CharacterDetail",
    "character detail",
    "edit character",
    "level",
    "maxHp",
    "currentHp",
  ],
  playMode: [
    "PlayMode",
    "play mode",
    "activeCharacter",
    "selectedCharacter",
    "characterId",
  ],
  levelUp: [
    "levelUp",
    "level up",
    "seviye atla",
    "applyCharacterLevelUp",
    "pendingSubclassChoice",
    "levelUpHistory",
  ],
  asiFeat: [
    "abilityScoreImprovement",
    "ability increase",
    "feat",
    "selectedFeatId",
    "abilityIncreases",
    "FeatCatalog",
  ],
  subclass: [
    "subclass",
    "subclassId",
    "pendingSubclassChoice",
    "SubclassCatalog",
  ],
  persistence: [
    "localStorage",
    "safeStorage",
    "characters",
    "saveCharacter",
    "updateCharacter",
    "setItem",
    "getItem",
  ],
  routing: [
    "Route",
    "path:",
    "navigate(",
    "useNavigate",
    "createBrowserRouter",
    "to=",
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
  const values = new Set();

  for (const pattern of [
    /data-testid\s*=\s*["']([^"']+)["']/g,
    /getByTestId\(\s*["']([^"']+)["']\s*\)/g,
  ]) {
    for (const match of content.matchAll(pattern)) {
      values.add(match[1]);
    }
  }

  return [...values].sort();
}

function extractRoutes(content) {
  const values = new Set();

  for (const pattern of [
    /path\s*:\s*["']([^"']+)["']/g,
    /path\s*=\s*["']([^"']+)["']/g,
    /navigate\(\s*["']([^"']+)["']/g,
    /to\s*=\s*["']([^"']+)["']/g,
  ]) {
    for (const match of content.matchAll(pattern)) {
      if (match[1].startsWith("/")) {
        values.add(match[1]);
      }
    }
  }

  return [...values].sort();
}

function extractStorageKeys(content) {
  const values = new Set();

  for (const pattern of [
    /localStorage\.(?:getItem|setItem)\(\s*["']([^"']+)["']/g,
    /(?:getItem|setItem)\(\s*["']([^"']+)["']/g,
  ]) {
    for (const match of content.matchAll(pattern)) {
      values.add(match[1]);
    }
  }

  return [...values].sort();
}

function extractExports(content) {
  return [
    ...new Set(
      [...content.matchAll(
        /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_$]+)/g,
      )].map((match) => match[1]),
    ),
  ].sort();
}

const files = (await Promise.all(scanRoots.map(walk))).flat();
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const matches = {};

  for (const [category, signals] of Object.entries(categories)) {
    const found = extractMatches(content, signals);

    if (found.length > 0) {
      matches[category] = found;
    }
  }

  if (Object.keys(matches).length === 0) continue;

  findings.push({
    file: relative(root, file).replaceAll("\\", "/"),
    matches,
    testIds: extractTestIds(content),
    routes: extractRoutes(content),
    storageKeys: extractStorageKeys(content),
    exports: extractExports(content),
    lineCount: content.split(/\r?\n/).length,
  });
}

function score(item, category) {
  const signalScore = (item.matches[category] ?? [])
    .reduce((sum, entry) => sum + entry.count * 10, 0);

  const file = item.file.toLowerCase();
  let bonus = 0;

  if (category === "builder" && file.includes("builder")) bonus += 150;
  if (category === "characterDetail" && file.includes("characterdetail")) bonus += 150;
  if (category === "playMode" && file.includes("playmode")) bonus += 150;
  if (category === "levelUp" && file.includes("levelup")) bonus += 120;
  if (category === "asiFeat" && file.includes("feat")) bonus += 80;
  if (category === "subclass" && file.includes("subclass")) bonus += 80;
  if (category === "persistence" && file.includes("storage")) bonus += 60;
  if (category === "testing" && file.startsWith("e2e/")) bonus += 60;

  return (
    signalScore +
    bonus +
    item.testIds.length * 3 +
    item.storageKeys.length * 2
  );
}

function top(category, limit = 30) {
  return findings
    .filter((item) => item.matches[category])
    .sort((a, b) => score(b, category) - score(a, category))
    .slice(0, limit);
}

const required = [
  "src/core/rulesets/levelUpProgressionRules.ts",
  "src/core/rulesets/levelUpCharacterAdapter.ts",
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
  package: "v5.114D1",
  domain: "level-up-ui-integration",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: findings.length,
  requiredRuntimeFiles: required,
  missingRequired,
  candidates: {
    builder: top("builder"),
    characterDetail: top("characterDetail"),
    playMode: top("playMode"),
    levelUp: top("levelUp"),
    asiFeat: top("asiFeat"),
    subclass: top("subclass"),
    persistence: top("persistence"),
    routing: top("routing"),
    testing: top("testing"),
  },
  consolidated: {
    testIds: [...new Set(findings.flatMap((item) => item.testIds))].sort(),
    routes: [...new Set(findings.flatMap((item) => item.routes))].sort(),
    storageKeys: [...new Set(findings.flatMap((item) => item.storageKeys))].sort(),
    exports: [...new Set(findings.flatMap((item) => item.exports))].sort(),
  },
};

report.status =
  missingRequired.length === 0 &&
  report.candidates.builder.length > 0 &&
  report.candidates.characterDetail.length > 0 &&
  report.candidates.playMode.length > 0 &&
  report.candidates.persistence.length > 0
    ? "READY"
    : "NEEDS_REVIEW";

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "level-up-ui-contract-v5.114D1.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(dir, "level-up-ui-contract-v5.114D1.md"),
  [
    "# Level-Up UI Integration Contract v5.114D1",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    `- Builder candidates: **${report.candidates.builder.length}**`,
    `- Character Detail candidates: **${report.candidates.characterDetail.length}**`,
    `- Play Mode candidates: **${report.candidates.playMode.length}**`,
    `- Level-Up candidates: **${report.candidates.levelUp.length}**`,
    `- ASI/Feat candidates: **${report.candidates.asiFeat.length}**`,
    `- Subclass candidates: **${report.candidates.subclass.length}**`,
    `- Persistence candidates: **${report.candidates.persistence.length}**`,
    `- Test IDs: **${report.consolidated.testIds.length}**`,
    `- Storage keys: **${report.consolidated.storageKeys.length}**`,
    "",
    "## Builder",
    "",
    ...report.candidates.builder.slice(0, 10).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Character Detail",
    "",
    ...report.candidates.characterDetail.slice(0, 10).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Play Mode",
    "",
    ...report.candidates.playMode.slice(0, 10).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Persistence",
    "",
    ...report.candidates.persistence.slice(0, 10).map(
      (item) => `- \`${item.file}\` — keys: ${item.storageKeys.join(", ") || "none"}`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Level-Up UI discovery: ${report.status}`);
console.log(`Matched files: ${report.matchedFiles}`);
console.log("Report: certification-reports/level-up-ui-contract-v5.114D1.json");
