import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const scanRoot = resolve(root, "src");
const ignored = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
]);
const allowed = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

async function walk(dir) {
  const files = [];

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

  return files;
}

const signals = [
  "levelUp",
  "level up",
  "characterLevel",
  "classLevels",
  "proficiencyBonus",
  "abilityScoreImprovement",
  "asi",
  "feat",
  "subclass",
  "hitPoints",
  "maxHp",
  "spellSlots",
  "cantrip",
  "multiclass",
  "experience",
  "xp",
  "level",
];

const files = await walk(scanRoot);
const matches = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lower = content.toLowerCase();

  const found = signals.filter((signal) =>
    lower.includes(signal.toLowerCase()),
  );

  if (found.length === 0) continue;

  const exports = [
    ...content.matchAll(
      /\bexport\s+(?:default\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_$]+)/g,
    ),
  ].map((match) => match[1]);

  matches.push({
    file: relative(root, file).replaceAll("\\", "/"),
    score: found.length,
    signals: found,
    exports: [...new Set(exports)].sort(),
    lineCount: content.split(/\r?\n/).length,
  });
}

matches.sort((a, b) => b.score - a.score);

const report = {
  package: "v5.114A",
  domain: "level-up-progression",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: matches.length,
  candidates: {
    levelUpRuntime: matches.filter((item) =>
      /level|progress|character/i.test(item.file),
    ).slice(0, 40),
    classProgression: matches.filter((item) =>
      /class|subclass|multiclass/i.test(item.file),
    ).slice(0, 40),
    spellProgression: matches.filter((item) =>
      /spell|caster/i.test(item.file),
    ).slice(0, 30),
    ui: matches.filter((item) =>
      item.file.endsWith(".tsx"),
    ).slice(0, 40),
  },
  status: matches.length > 0 ? "READY" : "NEEDS_REVIEW",
};

const dir = resolve(root, "certification-reports");
await mkdir(dir, { recursive: true });

await writeFile(
  resolve(
    dir,
    "level-up-progression-discovery-v5.114A.json",
  ),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(
    dir,
    "level-up-progression-discovery-v5.114A.md",
  ),
  [
    "# Level-Up Progression Discovery v5.114A",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    "",
    "## Highest-signal files",
    "",
    ...matches.slice(0, 20).map(
      (item) =>
        `- \`${item.file}\` — score ${item.score}, exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(
  `Level-up progression discovery: ${report.status}`,
);
console.log(`Matched files: ${report.matchedFiles}`);
console.log(
  "Report: certification-reports/level-up-progression-discovery-v5.114A.json",
);
