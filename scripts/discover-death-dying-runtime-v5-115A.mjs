import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
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
  hpRuntime: [
    "currentHp",
    "maxHp",
    "temporaryHp",
    "damage",
    "healing",
    "hitPoints",
  ],
  deathSaves: [
    "deathSave",
    "death save",
    "deathSaves",
    "successes",
    "failures",
    "stable",
    "dead",
  ],
  combat: [
    "CombatTracker",
    "combatant",
    "applyDamage",
    "applyHealing",
    "criticalHit",
  ],
  characterDetail: [
    "CharacterDetail",
    "PlayMode",
    "character sheet",
    "currentHp",
    "maxHp",
  ],
  persistence: [
    "localStorage",
    "safeStorage",
    "combatTrackerStorage",
    "saveCharacter",
    "updateCharacter",
    "setItem",
    "getItem",
  ],
  restRevival: [
    "revive",
    "revival",
    "stabilize",
    "longRest",
    "shortRest",
    "healing",
  ],
  ui: [
    "data-testid",
    "button",
    "checkbox",
    "NumberStepper",
    "Progress",
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

function extractExports(content) {
  return [
    ...new Set(
      [...content.matchAll(
        /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_$]+)/g,
      )].map((match) => match[1]),
    ),
  ].sort();
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
    exports: extractExports(content),
    testIds: extractTestIds(content),
    storageKeys: extractStorageKeys(content),
    lineCount: content.split(/\r?\n/).length,
  });
}

function score(item, category) {
  const signalScore = (item.matches[category] ?? [])
    .reduce((sum, entry) => sum + entry.count * 10, 0);

  const file = item.file.toLowerCase();
  let bonus = 0;

  if (category === "hpRuntime" && /hp|health|character/i.test(file)) bonus += 90;
  if (category === "deathSaves" && /death|dying/i.test(file)) bonus += 180;
  if (category === "combat" && /combat/i.test(file)) bonus += 120;
  if (category === "characterDetail" && /characterdetail|playmode/i.test(file)) bonus += 120;
  if (category === "persistence" && /storage/i.test(file)) bonus += 90;
  if (category === "restRevival" && /rest|reviv|heal/i.test(file)) bonus += 80;
  if (file.endsWith(".tsx")) bonus += 20;
  if (file.startsWith("e2e/")) bonus += 25;

  return (
    signalScore +
    bonus +
    item.exports.length * 2 +
    item.testIds.length * 3 +
    item.storageKeys.length * 2
  );
}

function top(category, limit = 40) {
  return findings
    .filter((item) => item.matches[category])
    .sort((a, b) => score(b, category) - score(a, category))
    .slice(0, limit);
}

const report = {
  package: "v5.115A",
  domain: "death-dying-stabilization-revival",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: findings.length,
  candidates: {
    hpRuntime: top("hpRuntime"),
    deathSaves: top("deathSaves"),
    combat: top("combat"),
    characterDetail: top("characterDetail"),
    persistence: top("persistence"),
    restRevival: top("restRevival"),
    ui: top("ui"),
  },
  consolidated: {
    exports: [...new Set(findings.flatMap((item) => item.exports))].sort(),
    testIds: [...new Set(findings.flatMap((item) => item.testIds))].sort(),
    storageKeys: [...new Set(findings.flatMap((item) => item.storageKeys))].sort(),
  },
};

report.status =
  report.candidates.hpRuntime.length > 0 &&
  report.candidates.combat.length > 0 &&
  report.candidates.characterDetail.length > 0 &&
  report.candidates.persistence.length > 0
    ? "READY"
    : "NEEDS_REVIEW";

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(dir, "death-dying-discovery-v5.115A.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(dir, "death-dying-discovery-v5.115A.md"),
  [
    "# Death, Dying, Stabilization & Revival Discovery v5.115A",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    `- HP runtime candidates: **${report.candidates.hpRuntime.length}**`,
    `- Death save candidates: **${report.candidates.deathSaves.length}**`,
    `- Combat candidates: **${report.candidates.combat.length}**`,
    `- Character Detail candidates: **${report.candidates.characterDetail.length}**`,
    `- Persistence candidates: **${report.candidates.persistence.length}**`,
    "",
    "## Highest-signal death-save files",
    "",
    ...report.candidates.deathSaves.slice(0, 15).map(
      (item) => `- \`${item.file}\` — exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
    "## Highest-signal HP/combat files",
    "",
    ...report.candidates.hpRuntime.slice(0, 10).map(
      (item) => `- \`${item.file}\``,
    ),
    ...report.candidates.combat.slice(0, 10).map(
      (item) => `- \`${item.file}\``,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Death & dying discovery: ${report.status}`);
console.log(`Matched files: ${report.matchedFiles}`);
console.log("Report: certification-reports/death-dying-discovery-v5.115A.json");
