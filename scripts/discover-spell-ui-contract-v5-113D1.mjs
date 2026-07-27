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
  spellbook: [
    "Spellbook",
    "spell book",
    "preparedSpells",
    "knownSpells",
    "spellSlots",
    "pactSlots",
  ],
  playMode: [
    "PlayMode",
    "castSpell",
    "spellSaveDc",
    "spellAttackBonus",
    "concentration",
    "activeEffects",
  ],
  combatTracker: [
    "CombatTracker",
    "currentHp",
    "maxHp",
    "damage",
    "healing",
    "target",
    "combatant",
  ],
  storage: [
    "localStorage",
    "safeStorage",
    "characters",
    "saveCharacter",
    "updateCharacter",
    "combatTrackerStorage",
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
      if (match[1].startsWith("/")) values.add(match[1]);
    }
  }

  return [...values].sort();
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

const files = (await Promise.all(scanRoots.map(walk))).flat();
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const matches = {};

  for (const [category, signals] of Object.entries(categories)) {
    const found = extractMatches(content, signals);
    if (found.length > 0) matches[category] = found;
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
    .reduce((sum, entry) => sum + entry.count * 10, 0);

  const file = item.file.toLowerCase();
  let bonus = 0;

  if (category === "spellbook" && file.includes("spellbook")) bonus += 120;
  if (category === "playMode" && file.includes("playmode")) bonus += 120;
  if (category === "combatTracker" && file.includes("combattracker")) bonus += 120;
  if (category === "storage" && file.includes("storage")) bonus += 60;
  if (category === "testing" && file.startsWith("e2e/")) bonus += 50;

  return signalScore + bonus + item.testIds.length * 2;
}

function top(category, limit = 20) {
  return findings
    .filter((item) => item.matches[category])
    .sort((a, b) => score(b, category) - score(a, category))
    .slice(0, limit);
}

const required = [
  "src/core/rulesets/spellRuntimeCombatRules.ts",
  "src/core/rulesets/spellCharacterCombatAdapter.ts",
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
  package: "v5.113D1",
  domain: "spell-ui-integration",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: findings.length,
  requiredRuntimeFiles: required,
  missingRequired,
  candidates: {
    spellbook: top("spellbook"),
    playMode: top("playMode"),
    combatTracker: top("combatTracker"),
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
  report.candidates.spellbook.length > 0 &&
  report.candidates.playMode.length > 0 &&
  report.candidates.combatTracker.length > 0 &&
  report.candidates.storage.length > 0
    ? "READY"
    : "NEEDS_REVIEW";

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "spell-ui-contract-v5.113D1.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(dir, "spell-ui-contract-v5.113D1.md"),
  [
    "# Spell UI Integration Contract v5.113D1",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    `- Spellbook candidates: **${report.candidates.spellbook.length}**`,
    `- Play Mode candidates: **${report.candidates.playMode.length}**`,
    `- Combat Tracker candidates: **${report.candidates.combatTracker.length}**`,
    `- Storage candidates: **${report.candidates.storage.length}**`,
    `- Test IDs: **${report.consolidated.testIds.length}**`,
    "",
    "## Spellbook",
    "",
    ...report.candidates.spellbook.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Play Mode",
    "",
    ...report.candidates.playMode.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Combat Tracker",
    "",
    ...report.candidates.combatTracker.slice(0, 8).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Spell UI discovery: ${report.status}`);
console.log(`Matched files: ${report.matchedFiles}`);
console.log("Report: certification-reports/spell-ui-contract-v5.113D1.json");
