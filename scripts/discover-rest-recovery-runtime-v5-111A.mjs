import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const reportDir = resolve(root, "certification-reports");

const keywords = [
  "short rest",
  "long rest",
  "hit dice",
  "hit die",
  "spell slot",
  "resource",
  "exhaustion",
  "death save",
  "concentration",
  "active spell effect",
  "temporary hp",
  "temp hp",
];

const symbolPatterns = [
  /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
  /\bexport\s+const\s+([A-Za-z0-9_$]+)\s*=/g,
  /\bexport\s+class\s+([A-Za-z0-9_$]+)/g,
];

const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const files = [];

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const full = resolve(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) {
      if (!["node_modules", "dist", "coverage", "test-results"].includes(name)) {
        await walk(full);
      }
      continue;
    }
    if ([...extensions].some((ext) => name.endsWith(ext))) files.push(full);
  }
}

await walk(srcRoot);

const matches = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lower = content.toLowerCase();
  const foundKeywords = keywords.filter((keyword) => lower.includes(keyword));
  if (foundKeywords.length === 0) continue;

  const exportedSymbols = new Set();
  for (const pattern of symbolPatterns) {
    for (const match of content.matchAll(pattern)) {
      exportedSymbols.add(match[1]);
    }
  }

  matches.push({
    file: relative(root, file).replaceAll("\\", "/"),
    keywords: foundKeywords,
    exportedSymbols: [...exportedSymbols].sort(),
    lineCount: content.split(/\r?\n/).length,
  });
}

matches.sort((a, b) => {
  const scoreDiff = b.keywords.length - a.keywords.length;
  return scoreDiff || a.file.localeCompare(b.file);
});

const capabilityHints = {
  shortRest: matches.filter((m) => m.keywords.includes("short rest")).map((m) => m.file),
  longRest: matches.filter((m) => m.keywords.includes("long rest")).map((m) => m.file),
  hitDice: matches.filter((m) => m.keywords.some((k) => k.includes("hit di"))).map((m) => m.file),
  spellSlots: matches.filter((m) => m.keywords.includes("spell slot")).map((m) => m.file),
  resources: matches.filter((m) => m.keywords.includes("resource")).map((m) => m.file),
  exhaustion: matches.filter((m) => m.keywords.includes("exhaustion")).map((m) => m.file),
  deathSaves: matches.filter((m) => m.keywords.includes("death save")).map((m) => m.file),
  concentration: matches.filter((m) => m.keywords.includes("concentration")).map((m) => m.file),
};

const report = {
  package: "v5.111A",
  domain: "rest-recovery-resource",
  generatedAt: new Date().toISOString(),
  scannedSourceFiles: files.length,
  matchedFiles: matches.length,
  capabilityHints,
  matches,
};

await mkdir(reportDir, { recursive: true });
await writeFile(
  resolve(reportDir, "rest-recovery-runtime-discovery-v5.111A.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const summary = [
  "# Rest / Recovery Runtime Discovery v5.111A",
  "",
  `- Scanned source files: **${files.length}**`,
  `- Matched files: **${matches.length}**`,
  "",
  "## Capability counts",
  "",
  ...Object.entries(capabilityHints).map(
    ([name, paths]) => `- ${name}: **${paths.length}** candidate file(s)`,
  ),
  "",
  "## Highest signal files",
  "",
  ...matches.slice(0, 20).map(
    (match) =>
      `- \`${match.file}\` — ${match.keywords.join(", ")} — exports: ${match.exportedSymbols.join(", ") || "none detected"}`,
  ),
  "",
].join("\n");

await writeFile(
  resolve(reportDir, "rest-recovery-runtime-discovery-v5.111A.md"),
  summary,
  "utf8",
);

console.log(`Rest/recovery discovery completed: ${matches.length} matching files.`);
console.log("Report: certification-reports/rest-recovery-runtime-discovery-v5.111A.json");
