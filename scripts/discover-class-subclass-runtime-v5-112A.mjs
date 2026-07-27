import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const src = resolve(root, "src");
const reportDir = resolve(root, "certification-reports");
const allowed = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ignored = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
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
  "classId",
  "subclassId",
  "classLevel",
  "subclass",
  "featureLevel",
  "proficiencyBonus",
  "shortRest",
  "longRest",
  "resourceId",
  "activation",
  "bonus-action",
  "reaction",
  "channel divinity",
  "rage",
  "ki",
  "focus points",
  "action surge",
  "second wind",
  "sneak attack",
  "wild shape",
  "bardic inspiration",
  "sorcery points",
  "lay on hands",
];

const files = await walk(src);
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
  package: "v5.112A",
  domain: "class-subclass-runtime",
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  matchedFiles: matches.length,
  highSignalFiles: matches.slice(0, 40),
  groups: {
    runtimeRules: matches.filter((item) =>
      /rules|runtime|class|subclass/i.test(item.file),
    ).slice(0, 30),
    resources: matches.filter((item) =>
      item.signals.some((signal) =>
        /rest|resource|rage|ki|focus|divinity|surge|inspiration|sorcery/i.test(signal),
      ),
    ).slice(0, 30),
    ui: matches.filter((item) =>
      /\.tsx$/.test(item.file),
    ).slice(0, 30),
  },
  status: matches.length > 0 ? "READY" : "NEEDS_REVIEW",
};

await mkdir(reportDir, { recursive: true });

await writeFile(
  resolve(reportDir, "class-subclass-runtime-discovery-v5.112A.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

await writeFile(
  resolve(reportDir, "class-subclass-runtime-discovery-v5.112A.md"),
  [
    "# Class/Subclass Runtime Discovery v5.112A",
    "",
    `- Status: **${report.status}**`,
    `- Scanned files: **${report.scannedFiles}**`,
    `- Matched files: **${report.matchedFiles}**`,
    "",
    "## Highest-signal files",
    "",
    ...report.highSignalFiles.slice(0, 20).map(
      (item) =>
        `- \`${item.file}\` — score ${item.score}, exports: ${item.exports.join(", ") || "none"}`,
    ),
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Class/subclass runtime discovery: ${report.status}`);
console.log(`Matched files: ${report.matchedFiles}`);
console.log(
  "Report: certification-reports/class-subclass-runtime-discovery-v5.112A.json",
);
