import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'certification-reports', 'n-mega1');
const RULESETS = ['dnd_2014', 'dnd_2024'];
const CATEGORIES = ['classes', 'subclasses', 'races', 'backgrounds', 'feats', 'spells', 'items'];
const CORE_CLASSES = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function norm(v) { return String(v ?? '').trim().toLowerCase(); }
function slug(v) { return norm(v).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) return -Number(literal(node.operand));
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : p.name.getText();
      out[key] = literal(p.initializer);
    }
    return out;
  }
  return undefined;
}

function exportedArray(file, exportName) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const st of ast.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const decl of st.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== exportName || !decl.initializer) continue;
      const value = literal(decl.initializer);
      return Array.isArray(value) ? value : [];
    }
  }
  return [];
}

const expansionConfig = {
  subclasses: ['src/core/rulesets/subclassExpansion.ts', 'SUBCLASS_EXPANSION'],
  feats: ['src/core/rulesets/featExpansion.ts', 'FEAT_EXPANSION'],
  spells: ['src/core/rulesets/spellExpansion.ts', 'SPELL_EXPANSION'],
  items: ['src/core/rulesets/itemExpansion.ts', 'ITEM_EXPANSION'],
};

function mergedCatalog(ruleset, category) {
  const baseFile = path.join(ROOT, 'public', 'data', ruleset, `${category}.json`);
  const base = fs.existsSync(baseFile) ? readJson(baseFile) : [];
  const cfg = expansionConfig[category];
  if (!cfg) return base.map(x => ({ ...x, _origin: 'base-json' }));
  const suffix = ruleset === 'dnd_2014' ? '2014' : '2024';
  const extra = exportedArray(path.join(ROOT, cfg[0]), `${cfg[1]}_${suffix}`);
  const seen = new Set(base.map(x => x.id));
  return [
    ...base.map(x => ({ ...x, _origin: 'base-json' })),
    ...extra.filter(x => x?.id && !seen.has(x.id)).map(x => ({ ...x, _origin: 'typescript-expansion' })),
  ];
}

function allSourceFiles() {
  const roots = ['src', 'e2e', 'scripts'];
  const result = [];
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mjs)$/.test(entry.name)) result.push(full);
    }
  };
  roots.forEach(r => walk(path.join(ROOT, r)));
  return result;
}

const sourceFiles = allSourceFiles();
const sourceTexts = new Map(sourceFiles.map(file => [file, fs.readFileSync(file, 'utf8')]));
function referencesFor(entity) {
  const needles = [...new Set([entity.id, entity.name].filter(Boolean).map(String).filter(x => x.length >= 3))];
  const hits = [];
  for (const [file, text] of sourceTexts) {
    if (needles.some(n => text.includes(n))) hits.push(path.relative(ROOT, file).replaceAll('\\', '/'));
  }
  return hits.slice(0, 30);
}

function validateEntity(category, entity, ruleset) {
  const issues = [];
  if (!entity.id) issues.push('missing-id');
  if (!entity.name) issues.push('missing-name');
  if (category === 'classes') {
    const levels = Array.isArray(entity.levels) ? entity.levels : [];
    const nums = new Set(levels.map(x => x.level));
    for (let n=1;n<=20;n++) if (!nums.has(n)) issues.push(`missing-level-${n}`);
    if (!Array.isArray(entity.savingThrows) || entity.savingThrows.length !== 2) issues.push('saving-throw-proficiency-count');
    if (!entity.skillChoices || !Number.isInteger(entity.skillChoices.choose)) issues.push('missing-skill-choice-contract');
  }
  if (category === 'subclasses') {
    if (!entity.className) issues.push('missing-class-link');
    if (!Number.isInteger(entity.selectionLevel)) issues.push('missing-selection-level');
    if (!Array.isArray(entity.features) || entity.features.length === 0) issues.push('missing-features');
    if (ruleset === 'dnd_2024' && entity.selectionLevel !== 3) issues.push('2024-subclass-not-level-3');
  }
  if (category === 'races') {
    if (!Number.isFinite(entity.speed)) issues.push('missing-speed');
    if (!Array.isArray(entity.traits) || entity.traits.length === 0) issues.push('missing-traits');
  }
  if (category === 'backgrounds') {
    if (!Array.isArray(entity.skillProficiencies)) issues.push('missing-skill-proficiencies');
    if (ruleset === 'dnd_2024' && !entity.originFeat) issues.push('2024-background-missing-origin-feat');
  }
  if (category === 'feats') {
    if (!entity.category) issues.push('missing-category');
    if (!Array.isArray(entity.benefits) || entity.benefits.length === 0) issues.push('missing-benefits');
  }
  if (category === 'spells') {
    for (const key of ['level','school','castingTime','range','duration']) if (entity[key] === undefined || entity[key] === '') issues.push(`missing-${key}`);
    if (!Array.isArray(entity.components)) issues.push('missing-components');
    if (!Array.isArray(entity.classes) || entity.classes.length === 0) issues.push('missing-class-list');
    if (entity.concentration === undefined) issues.push('missing-concentration-flag');
    if (entity.ritual === undefined) issues.push('missing-ritual-flag');
  }
  if (category === 'items') {
    if (!entity.category) issues.push('missing-category');
    if (!entity.cost) issues.push('missing-cost');
    if (!Number.isFinite(entity.weight)) issues.push('missing-weight');
  }
  return issues;
}

function duplicateIssues(items) {
  const issues = [];
  for (const key of ['id','name']) {
    const groups = new Map();
    for (const item of items) {
      const value = norm(item[key]);
      if (!value) continue;
      groups.set(value, [...(groups.get(value) ?? []), item]);
    }
    for (const [value, group] of groups) if (group.length > 1) issues.push({ type: `duplicate-${key}`, value, entities: group.map(x => x.id ?? x.name) });
  }
  return issues;
}

function severity(issue) {
  if (/missing-level|missing-id|missing-name|missing-class-link|missing-selection-level|2024-subclass/.test(issue)) return 'critical';
  if (/missing-features|origin-feat|skill-choice|class-list|saving-throw/.test(issue)) return 'high';
  return 'medium';
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  goal: 'Complete, copyright-safe player character creation and play management for D&D 2014 and 2024, level 1-20.',
  referenceProduct: 'D&D Beyond is a UX and capability reference only; it is not the source-of-truth scope.',
  rulesets: {},
  global: { sourceFilesScanned: sourceFiles.length, critical: 0, high: 0, medium: 0, duplicateGroups: [] },
};

for (const ruleset of RULESETS) {
  const rs = { categories: {}, classCoverage: {}, gaps: [] };
  for (const category of CATEGORIES) {
    const items = mergedCatalog(ruleset, category);
    const dupes = duplicateIssues(items);
    report.global.duplicateGroups.push(...dupes.map(x => ({ ruleset, category, ...x })));
    const entities = items.map(entity => {
      const issues = validateEntity(category, entity, ruleset);
      const refs = referencesFor(entity);
      const tests = refs.filter(f => /\.test\.|\.spec\./.test(f));
      if (tests.length === 0) issues.push('no-direct-id-or-name-test-reference');
      const severities = issues.map(severity);
      for (const sev of severities) report.global[sev]++;
      return {
        id: entity.id ?? slug(entity.name), name: entity.name ?? '(unnamed)', origin: entity._origin,
        issues, highestSeverity: severities.includes('critical') ? 'critical' : severities.includes('high') ? 'high' : issues.length ? 'medium' : 'none',
        testReferences: tests, sourceReferences: refs.filter(f => !/\.test\.|\.spec\./.test(f)),
      };
    });
    rs.categories[category] = { count: items.length, duplicateGroups: dupes.length, entities };
  }
  const classes = mergedCatalog(ruleset, 'classes');
  const subclasses = mergedCatalog(ruleset, 'subclasses');
  for (const className of CORE_CLASSES) {
    const cls = classes.find(x => norm(x.name) === norm(className));
    const linked = subclasses.filter(x => norm(x.className) === norm(className));
    rs.classCoverage[className] = {
      present: Boolean(cls), levelCount: cls?.levels?.length ?? 0, subclassCount: linked.length,
      subclassIds: linked.map(x => x.id),
    };
    if (!cls) rs.gaps.push({ severity: 'critical', type: 'missing-core-class', className });
    if (linked.length === 0) rs.gaps.push({ severity: 'critical', type: 'class-without-subclass', className });
  }
  report.rulesets[ruleset] = rs;
}

ensureDir(OUT);
fs.writeFileSync(path.join(OUT, 'PLAYER_CHARACTER_SYSTEM_INVENTORY.json'), JSON.stringify(report, null, 2));
for (const ruleset of RULESETS) {
  const rs = report.rulesets[ruleset];
  const matrix = [];
  for (const [category, data] of Object.entries(rs.categories)) for (const e of data.entities) matrix.push({ ruleset, category, ...e });
  fs.writeFileSync(path.join(OUT, `PLAYER_CHARACTER_PARITY_MATRIX_${ruleset === 'dnd_2014' ? '2014' : '2024'}.json`), JSON.stringify(matrix, null, 2));
}

const lines = [
  '# N-MEGA1 Player Character System Inventory', '',
  `Generated: ${report.generatedAt}`, '',
  '## Scope', '',
  '- D&D Beyond is used only as a builder and character-management capability reference.',
  '- The actual target is complete, copyright-safe D&D 2014 and 2024 player-character creation and play support from level 1 through 20.',
  '- This audit does not claim rules correctness merely because an entity exists.', '',
  '## Counts', '',
  '| Ruleset | Classes | Subclasses | Races/Species | Backgrounds | Feats | Spells | Items |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
];
for (const id of RULESETS) {
  const c = report.rulesets[id].categories;
  lines.push(`| ${id} | ${c.classes.count} | ${c.subclasses.count} | ${c.races.count} | ${c.backgrounds.count} | ${c.feats.count} | ${c.spells.count} | ${c.items.count} |`);
}
lines.push('', '## Structural findings', '', `- Critical findings: ${report.global.critical}`, `- High findings: ${report.global.high}`, `- Medium findings: ${report.global.medium}`, `- Duplicate groups: ${report.global.duplicateGroups.length}`, `- Source/test files scanned: ${report.global.sourceFilesScanned}`, '',
  '## Important limitation', '',
  'This first audit proves repository inventory and structural wiring only. Mechanical truth, official option completeness, builder reachability, runtime behavior, persistence, and level-by-level correctness require the later N-MEGA certification phases.', '',
  '## Next gate', '',
  'N-MEGA2 must create an independent 2014 expected-capability oracle and compare it against catalog, builder, sheet, runtime, rest, persistence, and tests. N-MEGA3 repeats the same process for 2024.'
);
fs.writeFileSync(path.join(OUT, 'N_MEGA1_SUMMARY.md'), lines.join('\n'));

const gaps = [];
for (const ruleset of RULESETS) {
  for (const [category, data] of Object.entries(report.rulesets[ruleset].categories)) {
    for (const e of data.entities) for (const issue of e.issues) gaps.push({ ruleset, category, id: e.id, name: e.name, severity: severity(issue), issue });
  }
}
fs.writeFileSync(path.join(OUT, 'PLAYER_CHARACTER_SYSTEM_GAPS.json'), JSON.stringify(gaps, null, 2));
console.log(`N-MEGA1 inventory written to ${path.relative(ROOT, OUT)}`);
console.log(`2014/2024 catalogs scanned; critical=${report.global.critical}, high=${report.global.high}, medium=${report.global.medium}`);
