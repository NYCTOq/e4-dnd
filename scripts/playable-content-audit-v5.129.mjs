import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const uniq = (xs) => [...new Set(xs)];
const matches = (text, re, group = 1) => [...text.matchAll(re)].map(m => m[group]).filter(Boolean);

const sources = {
  classes: 'src/certification/reference/classes.full.reference.ts',
  subclasses: 'src/core/rulesets/subclassExpansion.ts',
  spells: 'src/core/rulesets/spellExpansion.ts',
  feats: 'src/core/rulesets/featExpansion.ts',
  items: 'src/core/rulesets/itemExpansion.ts',
  classRuntime: 'src/core/rulesets/classFeatureRuntime.ts',
  subclassRuntime: 'src/core/rulesets/subclassRuntimeRules.ts',
  spellRuntime: 'src/core/rulesets/spellBehaviorRules.ts',
  featRuntime: 'src/core/rulesets/featRuntimeRules.ts',
  itemRuntime: 'src/core/rulesets/itemEffectRuntimeRules.ts',
};

for (const [name, file] of Object.entries(sources)) {
  if (!exists(file)) throw new Error(`Required ${name} source missing: ${file}`);
}

const classText = read(sources.classes);
const subclassText = read(sources.subclasses);
const spellText = read(sources.spells);
const featText = read(sources.feats);
const itemText = read(sources.items);
const runtimeTexts = {
  class: read(sources.classRuntime),
  subclass: read(sources.subclassRuntime),
  spell: read(sources.spellRuntime),
  feat: read(sources.featRuntime),
  item: read(sources.itemRuntime),
};

const classes = uniq(matches(classText, /\{\s*id:\s*"([^"]+)"\s*,\s*name:/g));
const subclasses = uniq([
  ...matches(subclassText, /make\(\s*"([^"]+)"/g),
  ...matches(subclassText, /\[\s*"([^"]+)"\s*,\s*"[^"]+"\s*,\s*"[^"]+"/g),
]);
const spells = uniq(matches(spellText, /\[\s*"([^"]+)"\s*,\s*\d+\s*,\s*"[^"]+"\s*,\s*"[^"]+"/g));
const feats = uniq([
  ...matches(featText, /id:\s*"([^"]+)"/g),
  ...matches(featText, /\[\s*"([^"]+)"\s*,\s*"[^"]+"/g),
]);
const items = uniq([
  ...matches(itemText, /id:\s*"([^"]+)"/g),
  ...matches(itemText, /\[\s*"([^"]+)"\s*,\s*"[^"]+"/g),
]);

const countRuntimeSignals = (text) => ({
  handlers: (text.match(/case\s+["'`]/g) || []).length + (text.match(/id\s*===\s*["'`]/g) || []).length,
  resourceMentions: (text.match(/resource|charge|usage|uses/gi) || []).length,
  persistenceMentions: (text.match(/persist|storage|saved|state/gi) || []).length,
});

const runtime = Object.fromEntries(Object.entries(runtimeTexts).map(([k,v]) => [k, countRuntimeSignals(v)]));
const tests = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(test|spec)\.(ts|tsx)$/.test(ent.name)) tests.push(path.relative(root, p).replaceAll('\\','/'));
  }
};
walk(path.join(root, 'src'));
walk(path.join(root, 'e2e'));

const priorities = [
  { rank: 1, id: 'class-runtime-depth', title: 'Class feature runtime depth', reason: 'Twelve classes exist, but catalogue presence is not the same as every level feature being interactive in play mode.', nextPackage: 'v5.130 Class Runtime Completion Mega' },
  { rank: 2, id: 'subclass-runtime-depth', title: 'Subclass feature runtime depth', reason: 'Subclass catalogue is broad; the next risk is placeholder summaries without executable resources, actions, reactions, saves or persistence.', nextPackage: 'v5.131 Subclass Runtime Completion Mega' },
  { rank: 3, id: 'spell-edge-runtime', title: 'Spell edge-case runtime', reason: 'Spell catalogue is large; summons, persistent zones, reactions, concentration and material-cost flows need playable parity rather than catalogue-only coverage.', nextPackage: 'v5.132 Spell Runtime Completion Mega' },
  { rank: 4, id: 'feat-item-effects', title: 'Feat and item effect wiring', reason: 'Passive bonuses are useful, but action-granting feats and charged items must appear and persist in sheet/play flows.', nextPackage: 'v5.133 Feat & Item Runtime Mega' },
  { rank: 5, id: 'campaign-play-loop', title: 'Campaign-to-play loop', reason: 'Characters, encounters, rest, loot and journals exist; the remaining value is a continuous session loop with fewer manual jumps.', nextPackage: 'v5.134 Session Play Loop Mega' },
];

const audit = {
  version: '5.129.0',
  generatedAt: new Date().toISOString(),
  counts: { classes: classes.length, subclasses: subclasses.length, spells: spells.length, feats: feats.length, items: items.length, tests: tests.length },
  classes,
  runtime,
  priorities,
  policy: {
    implementationFirst: true,
    maxCriticalE2EPerPackage: 6,
    separateDiscoveryPackages: false,
    rule: 'Every package after v5.129 must add a playable user-facing capability and include only targeted tests.'
  }
};

fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/PLAYABLE_CONTENT_AUDIT_v5.129.json'), JSON.stringify(audit, null, 2) + '\n');
const md = `# E4 D&D Playable Content Audit v5.129\n\nGenerated: ${audit.generatedAt}\n\n## Inventory\n\n| Area | Detected |\n|---|---:|\n| Classes | ${audit.counts.classes} |\n| Subclasses | ${audit.counts.subclasses} |\n| Spells | ${audit.counts.spells} |\n| Feats | ${audit.counts.feats} |\n| Items | ${audit.counts.items} |\n| Automated test files | ${audit.counts.tests} |\n\n## Decision\n\nThe project already has extensive certification coverage. From v5.130 onward, separate discovery/matrix/golden/UI closure package chains are frozen. Each package must deliver a playable capability and carry only targeted regression tests.\n\n## Implementation order\n\n${priorities.map(p => `${p.rank}. **${p.title}**  \n   ${p.reason}  \n   Next: \`${p.nextPackage}\``).join('\n\n')}\n\n## Runtime signals\n\n\`\`\`json\n${JSON.stringify(runtime, null, 2)}\n\`\`\`\n`;
fs.writeFileSync(path.join(root, 'reports/PLAYABLE_CONTENT_AUDIT_v5.129.md'), md);
console.log(`[v5.129] classes=${classes.length} subclasses=${subclasses.length} spells=${spells.length} feats=${feats.length} items=${items.length} tests=${tests.length}`);
console.log('[v5.129] reports/PLAYABLE_CONTENT_AUDIT_v5.129.md');
