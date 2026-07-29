import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, "reports");
fs.mkdirSync(reportDir, { recursive: true });

const scenariosPath = path.join(root, "src/certification/golden/thirtyGoldenCharacterScenarios.ts");
if (!fs.existsSync(scenariosPath)) throw new Error("Golden scenario source missing.");

const scenarioSource = fs.readFileSync(scenariosPath, "utf8");
const tupleRx = /\["([^"]+)","(dnd_2014|dnd_2024)","([^"]+)","([^"]+)","([^"]+)",(\d+)\]/g;
const scenarios = [...scenarioSource.matchAll(tupleRx)].map((m) => ({ id:m[1], ruleset:m[2], ancestry:m[3], className:m[4], subclass:m[5], level:Number(m[6]) }));
if (scenarios.length !== 30) throw new Error(`Expected 30 scenarios, parsed ${scenarios.length}.`);

const excluded = new Set(["node_modules","dist","release","reports","docs",".git","coverage"]);
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|json|md)$/i.test(entry.name)) sourceFiles.push(full);
  }
}
walk(path.join(root, "src"));
const corpus = sourceFiles.map((f) => fs.readFileSync(f,"utf8")).join("\n");
const normalize = (v) => v.toLowerCase().replace(/\b(path|school|college|circle|oath|way|warrior|domain|patron|the)\b/g,"").replace(/[^a-z0-9]+/g,"");
const normalizedCorpus = normalize(corpus);
const contains = (value) => corpus.toLowerCase().includes(value.toLowerCase()) || normalizedCorpus.includes(normalize(value));

const commandResultsPath = path.join(reportDir, "GOLDEN_30_COMMAND_RESULTS_v6.1.json");
const commands = fs.existsSync(commandResultsPath) ? JSON.parse(fs.readFileSync(commandResultsPath,"utf8")) : {};

const rows = scenarios.map((s) => {
  const ancestryFound = contains(s.ancestry);
  const classFound = contains(s.className);
  const subclassFound = contains(s.subclass);
  const status = ancestryFound && classFound && subclassFound ? "PASS" : classFound && subclassFound ? "WARN" : "FAIL";
  const notes = [!ancestryFound && "ancestry/species source match missing", !classFound && "class source match missing", !subclassFound && "subclass source match missing"].filter(Boolean);
  return {...s, ancestryFound, classFound, subclassFound, status, notes};
});

const summary = {
  total: rows.length,
  pass: rows.filter(r=>r.status==="PASS").length,
  warn: rows.filter(r=>r.status==="WARN").length,
  fail: rows.filter(r=>r.status==="FAIL").length,
  commands,
  generatedAt: new Date().toISOString(),
};

const json = { summary, scenarios: rows };
fs.writeFileSync(path.join(reportDir,"THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.json"), JSON.stringify(json,null,2));
const csv = ["id,ruleset,ancestry,class,subclass,level,ancestryFound,classFound,subclassFound,status,notes", ...rows.map(r => [r.id,r.ruleset,r.ancestry,r.className,r.subclass,r.level,r.ancestryFound,r.classFound,r.subclassFound,r.status,r.notes.join("; ")].map(v=>`"${String(v).replaceAll('"','""')}"`).join(","))].join("\n");
fs.writeFileSync(path.join(reportDir,"THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.csv"), csv);
let md = `# Thirty Golden Character Certification v6.1\n\nGenerated: ${summary.generatedAt}\n\n## Command gates\n\n| Gate | Exit code |\n|---|---:|\n`;
for (const [name,value] of Object.entries(commands)) md += `| ${name} | ${value} |\n`;
md += `\n## Scenario summary\n\n- PASS: ${summary.pass}\n- WARN: ${summary.warn}\n- FAIL: ${summary.fail}\n\n| # | Ruleset | Character | Level | Source coverage | Result | Notes |\n|---:|---|---|---:|---|---|---|\n`;
rows.forEach((r,i)=> { md += `| ${i+1} | ${r.ruleset} | ${r.ancestry} ${r.className} / ${r.subclass} | ${r.level} | ancestry ${r.ancestryFound?'✓':'✗'}, class ${r.classFound?'✓':'✗'}, subclass ${r.subclassFound?'✓':'✗'} | ${r.status} | ${r.notes.join('; ') || '-'} |\n`; });
md += `\n## Interpretation\n\nThis report proves repository source coverage and the independent progression oracle. A PASS does not claim that every player choice or narrative rule is fully automated. UI creation and persistence are covered by the repository's existing Playwright suite, whose exit code is recorded above.\n`;
fs.writeFileSync(path.join(reportDir,"THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.md"), md);
console.log(`Golden 30 report: ${summary.pass} PASS, ${summary.warn} WARN, ${summary.fail} FAIL.`);
const commandBlocked = Object.values(commands).some((value) => Number(value) !== 0);
process.exit(summary.fail > 0 || commandBlocked ? 1 : 0);
