import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'certification-reports', 'n-mega2');
const DATA = path.join(ROOT, 'public', 'data', 'dnd_2014');
const CORE = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const PB = [0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
const SPELLCASTERS = new Set(['Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Warlock','Wizard']);
const CHOICE_SURFACES = {
  Fighter: ['fightingStyleIds'],
  Paladin: ['fightingStyleIds'],
  Ranger: ['fightingStyleIds'],
  Sorcerer: ['metamagicIds'],
  Warlock: ['invocationIds','arcanumSpellIds'],
  Druid: ['wildShapeFormIds'],
};
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
const json = p => JSON.parse(read(p));
const exists = p => fs.existsSync(path.join(ROOT,p));
const norm = v => String(v ?? '').trim().toLowerCase();
const findings = [];
const add = (severity, code, message, evidence={}) => findings.push({severity,code,message,evidence});

for (const f of ['classes.json','subclasses.json','races.json','backgrounds.json','feats.json','spells.json','items.json']) {
  if (!fs.existsSync(path.join(DATA,f))) add('critical','missing-catalog',`Missing 2014 catalog ${f}`,{file:f});
}
const classes = json('public/data/dnd_2014/classes.json');
const subclasses = json('public/data/dnd_2014/subclasses.json');
const races = json('public/data/dnd_2014/races.json');
const backgrounds = json('public/data/dnd_2014/backgrounds.json');
const feats = json('public/data/dnd_2014/feats.json');
const spells = json('public/data/dnd_2014/spells.json');
const items = json('public/data/dnd_2014/items.json');

const validationFile = 'src/core/rulesets/characterValidation.ts';
const validation = exists(validationFile) ? read(validationFile) : '';
const requiredValidationTokens = [
  'draft.level < 1 || draft.level > 20', 'classData.subclassLevel', 'normalizeClassSkillChoices',
  'getGeneralFeatSlotCount', 'isFeatEligible', 'getSpellcastingProfile', 'isSpellAvailableToClass',
  'getFightingStyleChoiceCount', 'getMetamagicChoiceCount', 'getInvocationChoiceCount',
  'getWildShapeKnownCount', 'getManeuverChoiceCount', 'getCompanionChoiceCount',
  'getMysticArcanumLevels', 'equipped.some', 'draft.maxHp < 1', 'draft.gold < 0'
];
if (!validation) add('critical','missing-character-validation','characterValidation.ts is missing');
for (const token of requiredValidationTokens) if (!validation.includes(token)) add('high','validation-surface-missing',`2014 builder validation surface does not reference ${token}`,{file:validationFile,token});

const classMatrix = [];
for (const className of CORE) {
  const c = classes.find(x => norm(x.name) === norm(className));
  const row = {className,present:Boolean(c),levels:[],subclasses:[],builderCertification:null,choiceSurfaces:[]};
  if (!c) { add('critical','missing-core-class',`${className} is missing from 2014 classes`,{className}); classMatrix.push(row); continue; }
  if (!Array.isArray(c.savingThrows) || c.savingThrows.length !== 2) add('critical','invalid-saving-throws',`${className} must have exactly two saving throw proficiencies`,{value:c.savingThrows});
  if (!c.skillChoices || !Number.isInteger(c.skillChoices.choose) || !Array.isArray(c.skillChoices.from) || c.skillChoices.from.length < c.skillChoices.choose) add('critical','invalid-skill-contract',`${className} skill choice contract is invalid`,{skillChoices:c.skillChoices});
  if (!Number.isInteger(c.subclassLevel) || c.subclassLevel < 1 || c.subclassLevel > 20) add('critical','invalid-subclass-level',`${className} subclass level is invalid`,{subclassLevel:c.subclassLevel});
  const levels = Array.isArray(c.levels) ? c.levels : [];
  for (let level=1; level<=20; level++) {
    const entry = levels.find(x => x.level === level);
    const check = {level,present:Boolean(entry),proficiencyBonus:entry?.proficiencyBonus,featureCount:entry?.features?.length ?? 0};
    row.levels.push(check);
    if (!entry) add('critical','missing-class-level',`${className} is missing level ${level}`,{className,level});
    else {
      if (entry.proficiencyBonus !== PB[level]) add('critical','wrong-proficiency-bonus',`${className} level ${level} proficiency bonus is wrong`,{expected:PB[level],actual:entry.proficiencyBonus});
      if (!Array.isArray(entry.features)) add('high','missing-feature-array',`${className} level ${level} has no feature array`,{className,level});
    }
  }
  const linked = subclasses.filter(x => norm(x.className) === norm(className));
  row.subclasses = linked.map(x => ({id:x.id,name:x.name,selectionLevel:x.selectionLevel,featureCount:x.features?.length ?? 0}));
  if (!linked.length) add('critical','class-without-subclass',`${className} has no 2014 subclass`,{className});
  for (const sub of linked) {
    if (sub.selectionLevel !== c.subclassLevel) add('critical','subclass-threshold-mismatch',`${sub.name} selection level does not match ${className}`,{classSubclassLevel:c.subclassLevel,subclassSelectionLevel:sub.selectionLevel});
    if (!Array.isArray(sub.features) || !sub.features.length) add('high','subclass-without-features',`${sub.name} has no features`,{id:sub.id});
  }
  const certFile = `src/core/rulesets/${className.toLowerCase()}BuilderCertification.ts`;
  const certTest = `src/core/rulesets/${className.toLowerCase()}BuilderCertification.test.ts`;
  row.builderCertification = {implementation:exists(certFile),test:exists(certTest)};
  if (!exists(certFile)) add('high','missing-builder-certification',`${className} builder certification implementation is missing`,{file:certFile});
  if (!exists(certTest)) add('high','missing-builder-certification-test',`${className} builder certification test is missing`,{file:certTest});
  for (const surface of CHOICE_SURFACES[className] ?? []) {
    const present = validation.includes(surface);
    row.choiceSurfaces.push({surface,present});
    if (!present) add('high','missing-special-choice-validation',`${className} special choice ${surface} is not validated`,{className,surface});
  }
  if (SPELLCASTERS.has(className)) {
    const spellCount = spells.filter(s => Array.isArray(s.classes) && s.classes.some(n => norm(n)===norm(className))).length;
    row.spellCount = spellCount;
    if (!spellCount) add('critical','spellcaster-without-spells',`${className} has no spells in the base 2014 catalog`,{className});
  }
  classMatrix.push(row);
}

for (const [category,data] of Object.entries({races,backgrounds,feats,spells,items})) {
  if (!Array.isArray(data) || !data.length) add('critical','empty-player-catalog',`2014 ${category} catalog is empty`,{category});
  const ids = new Map();
  for (const entity of data) {
    if (!entity.id) add('critical','missing-entity-id',`2014 ${category} entity is missing id`,{name:entity.name});
    if (!entity.name) add('critical','missing-entity-name',`2014 ${category} entity is missing name`,{id:entity.id});
    if (entity.id) ids.set(entity.id,(ids.get(entity.id)??0)+1);
  }
  for (const [id,count] of ids) if (count>1) add('critical','duplicate-entity-id',`2014 ${category} duplicate id ${id}`,{count});
}

const expectedTests = [
 'src/core/rulesets/levelOneToTwentyJourney.test.ts',
 'src/core/rulesets/classProgressionAudit.test.ts',
 'src/core/rulesets/characterValidation.test.ts',
 'src/core/rulesets/subclassRules.test.ts',
 'src/core/rulesets/classSpellSelectionRules.test.ts',
 'src/core/rulesets/ancestryChoiceRules.test.ts',
 'src/core/rulesets/unifiedCharacterChoices.test.ts',
 'src/core/rulesets/level20Certification.test.ts',
 'src/core/rulesets/singleClassPlayableReadiness.test.ts'
];
for (const file of expectedTests) if (!exists(file)) add('high','missing-regression-contract',`Expected 2014 regression contract is missing`,{file});

const severityCounts = {critical:0,high:0,medium:0,info:0};
for (const f of findings) severityCounts[f.severity] = (severityCounts[f.severity]??0)+1;
const report = {
 schemaVersion:2,
 generatedAt:new Date().toISOString(),
 phase:'N-MEGA2',
 scope:'D&D 2014 player-character builder and level 1-20 structural capability audit',
 principle:'D&D Beyond is only a capability and UX reference. Mechanical correctness and complete player operation are the target.',
 counts:{classes:classes.length,subclasses:subclasses.length,races:races.length,backgrounds:backgrounds.length,feats:feats.length,spells:spells.length,items:items.length},
 severityCounts,classMatrix,findings,
 nextActions:[
  'Close every critical structural finding before 2014 mechanical parity certification.',
  'Independently verify feature timing and choice counts rather than trusting production data as its own oracle.',
  'Trace each player option through catalog, builder, character state, sheet, runtime, rest, persistence and export/import.'
 ]
};
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'N_MEGA2_2014_BUILDER_PROGRESSION_AUDIT.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA2_2014_CLASS_LEVEL_MATRIX.json'),JSON.stringify(classMatrix,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA2_2014_GAPS.json'),JSON.stringify(findings,null,2));
const md = [
 '# N-MEGA2 2014 Builder and Progression Audit','',
 `Generated: ${report.generatedAt}`,'',
 '## Result','',
 `- Critical: ${severityCounts.critical}`,
 `- High: ${severityCounts.high}`,
 `- Medium: ${severityCounts.medium}`,'',
 '## Catalog counts','',
 `- Classes: ${classes.length}`,
 `- Subclasses: ${subclasses.length}`,
 `- Races: ${races.length}`,
 `- Backgrounds: ${backgrounds.length}`,
 `- Feats: ${feats.length}`,
 `- Base spells: ${spells.length}`,
 `- Base items: ${items.length}`,'',
 '## Gate','',
 severityCounts.critical === 0 ? 'Structural gate: GREEN. This does not yet certify every mechanic.' : 'Structural gate: RED. Critical structural gaps must be closed.','',
 '## Scope note','',
 'D&D Beyond is used only as a builder and character-management capability reference. The target is complete, copyright-safe player operation for D&D 2014 from level 1 through 20.'
];
fs.writeFileSync(path.join(OUT,'N_MEGA2_SUMMARY.md'),md.join('\n'));
console.log(`N-MEGA2 audit written to ${path.relative(ROOT,OUT)}`);
console.log(`critical=${severityCounts.critical}, high=${severityCounts.high}, medium=${severityCounts.medium}`);
if (severityCounts.critical > 0) process.exitCode = 2;
