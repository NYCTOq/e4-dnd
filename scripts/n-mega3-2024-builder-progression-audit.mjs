import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd(), OUT=path.join(ROOT,'certification-reports','n-mega3'), DATA=path.join(ROOT,'public','data','dnd_2024');
const CORE=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const PB=[0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
const MARTIAL=new Set(['Barbarian','Fighter','Paladin','Ranger','Rogue']);
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'), json=p=>JSON.parse(read(p)), exists=p=>fs.existsSync(path.join(ROOT,p)), norm=v=>String(v??'').trim().toLowerCase();
const findings=[], add=(severity,code,message,evidence={})=>findings.push({severity,code,message,evidence});
for(const f of ['classes.json','subclasses.json','races.json','backgrounds.json','feats.json','spells.json','items.json']) if(!fs.existsSync(path.join(DATA,f))) add('critical','missing-catalog',`Missing 2024 catalog ${f}`,{file:f});
const classes=json('public/data/dnd_2024/classes.json'), subclasses=json('public/data/dnd_2024/subclasses.json'), species=json('public/data/dnd_2024/races.json'), backgrounds=json('public/data/dnd_2024/backgrounds.json'), feats=json('public/data/dnd_2024/feats.json'), spells=json('public/data/dnd_2024/spells.json'), items=json('public/data/dnd_2024/items.json');
const featKeys=new Set(feats.flatMap(f=>[norm(f.id),norm(f.name)]));
const itemMasteries=new Set(items.filter(i=>i.category==='weapon').map(i=>norm(i.mastery)).filter(Boolean));
const classMatrix=[];
for(const className of CORE){
 const c=classes.find(x=>norm(x.name)===norm(className)); const row={className,present:!!c,levels:[],subclasses:[],weaponMastery:false,epicBoon:false};
 if(!c){add('critical','missing-core-class',`${className} missing`,{className});classMatrix.push(row);continue;}
 if(c.subclassLevel!==3)add('critical','class-subclass-level',`${className} subclass level must be 3`,{actual:c.subclassLevel});
 if(!Array.isArray(c.savingThrows)||c.savingThrows.length!==2)add('critical','invalid-saving-throws',`${className} saving throws invalid`);
 if(!c.skillChoices||!Number.isInteger(c.skillChoices.choose)||!Array.isArray(c.skillChoices.from)||c.skillChoices.from.length<c.skillChoices.choose)add('critical','invalid-skill-contract',`${className} skill contract invalid`);
 for(let level=1;level<=20;level++){
  const e=(c.levels??[]).find(x=>x.level===level); const features=e?.features??[];
  row.levels.push({level,present:!!e,proficiencyBonus:e?.proficiencyBonus,features});
  if(!e)add('critical','missing-class-level',`${className} missing level ${level}`,{className,level});
  else {if(e.proficiencyBonus!==PB[level])add('critical','wrong-proficiency-bonus',`${className} level ${level} PB wrong`,{expected:PB[level],actual:e.proficiencyBonus});if(!Array.isArray(e.features))add('high','missing-feature-array',`${className} level ${level} feature array missing`);}
 }
 const l19=(c.levels??[]).find(x=>x.level===19); row.epicBoon=!!l19?.features?.some(f=>/epic boon/i.test(f)); if(!row.epicBoon)add('critical','missing-epic-boon',`${className} level 19 Epic Boon missing`);
 const linked=subclasses.filter(s=>norm(s.className)===norm(className)); row.subclasses=linked.map(s=>({id:s.id,name:s.name,selectionLevel:s.selectionLevel,featureLevels:(s.features??[]).map(f=>f.level)}));
 if(!linked.length)add('critical','class-without-subclass',`${className} has no 2024 subclass`);
 for(const s of linked){if(s.selectionLevel!==3)add('critical','subclass-not-level-3',`${s.name} selection level must be 3`,{actual:s.selectionLevel});if(!(s.features??[]).length)add('high','subclass-without-features',`${s.name} has no features`);if((s.features??[]).some(f=>f.level<3||f.level>20))add('critical','subclass-feature-level-invalid',`${s.name} feature level invalid`);}
 const masteryRows=(c.levels??[]).filter(x=>Number.isInteger(x.weaponMasteryCount)&&x.weaponMasteryCount>0); row.weaponMastery=masteryRows.length>0;
 if(MARTIAL.has(className)&&!row.weaponMastery)add('high','missing-weapon-mastery-progression',`${className} lacks Weapon Mastery progression`);
 classMatrix.push(row);
}
for(const s of species){if(Object.keys(s.abilityBonuses??{}).length)add('critical','species-grants-ability-bonus',`${s.name} improperly grants 2024 ability bonuses`,{abilityBonuses:s.abilityBonuses});if(!Number.isFinite(s.speed))add('high','species-speed-missing',`${s.name} speed missing`);if(!(s.traits??[]).length)add('high','species-traits-missing',`${s.name} traits missing`);}
for(const b of backgrounds){if(!Array.isArray(b.abilityOptions)||b.abilityOptions.length!==3)add('critical','background-ability-options',`${b.name} must expose three ability options`,{value:b.abilityOptions});if(!['2024-plus2-plus1','2024-three-ones'].includes(b.abilityBonusMode))add('critical','background-ability-mode',`${b.name} ability bonus mode invalid`,{value:b.abilityBonusMode});if(!b.originFeat)add('critical','background-origin-feat-missing',`${b.name} origin feat missing`);else if(!featKeys.has(norm(b.originFeat)))add('critical','background-origin-feat-unresolved',`${b.name} origin feat unresolved`,{originFeat:b.originFeat});if(!Array.isArray(b.skillProficiencies)||b.skillProficiencies.length!==2)add('high','background-skills-invalid',`${b.name} should grant two skills`);}
for(const f of feats){if(!['origin','general','fighting-style','epic-boon'].includes(norm(f.category)))add('high','feat-category-invalid',`${f.name} category invalid`,{category:f.category});if(norm(f.category)==='epic-boon' && !/19|level 19/i.test(JSON.stringify(f.prerequisite??f.prerequisites??f.summary??'')))add('medium','epic-boon-prerequisite-not-explicit',`${f.name} does not explicitly encode level 19 in base catalog`);if(!(f.benefits??[]).length)add('high','feat-benefits-missing',`${f.name} benefits missing`);}
if(!itemMasteries.size)add('critical','weapon-mastery-catalog-empty','No weapon mastery values found on 2024 weapons');
for(const i of items.filter(x=>x.category==='weapon'))if(!i.mastery)add('high','weapon-without-mastery',`${i.name} has no mastery property`,{id:i.id});
const sourceChecks={
 originRules:['src/core/rulesets/originRules.ts','src/core/rulesets/originRules.test.ts'],
 levelOneOrigin:['src/core/rulesets/levelOneOriginReadiness.ts','src/core/rulesets/levelOneOriginReadiness.test.ts'],
 weaponMastery:['src/core/rulesets/weaponMasteryRuntimeRules.ts','src/core/rulesets/weaponMasteryRuntimeRules.test.ts','src/core/rulesets/equipmentRules.test.ts'],
 epicBoon:['src/core/rulesets/featCatalog2024Official.test.ts','src/core/rulesets/officialFeatCatalog2024.ts'],
 progression:['src/core/rulesets/martialOfficialProgression.test.ts','src/core/rulesets/halfCasterOfficialProgression.test.ts','src/core/rulesets/clericDruidOfficialProgression.test.ts','src/core/rulesets/bardSorcererOfficialProgression.test.ts','src/core/rulesets/warlockWizardOfficialProgression.test.ts'],
 builder:['src/core/rulesets/singleClassBuilderFinalCertification.integration.test.ts','src/core/rulesets/singleClassBuilderUiRules.test.ts','src/core/rulesets/highLevelAbilityBuilder.test.ts'],
 spell:['src/core/rulesets/spellBuilderOfficial.test.ts','src/core/rulesets/spellRuntimeOfficial2024.test.ts']
};
for(const [surface,files] of Object.entries(sourceChecks))for(const file of files)if(!exists(file))add('high','missing-2024-contract',`${surface} contract missing`,{file});
const severityCounts={critical:0,high:0,medium:0,info:0};for(const f of findings)severityCounts[f.severity]=(severityCounts[f.severity]??0)+1;
const report={schemaVersion:3,generatedAt:new Date().toISOString(),phase:'N-MEGA3',scope:'D&D 2024 player-character builder, origin, progression, Weapon Mastery and Epic Boon structural audit',principle:'D&D Beyond is a capability reference only; complete copyright-safe player operation is the target.',counts:{classes:classes.length,subclasses:subclasses.length,species:species.length,backgrounds:backgrounds.length,feats:feats.length,spells:spells.length,items:items.length,weaponMasteries:itemMasteries.size},severityCounts,classMatrix,sourceChecks,findings};
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'N_MEGA3_2024_BUILDER_PROGRESSION_AUDIT.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA3_2024_CLASS_LEVEL_MATRIX.json'),JSON.stringify(classMatrix,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA3_2024_GAPS.json'),JSON.stringify(findings,null,2));
const md=['# N-MEGA3 2024 Builder and Progression Audit','',`Generated: ${report.generatedAt}`,'','## Result','',`- Critical: ${severityCounts.critical}`,`- High: ${severityCounts.high}`,`- Medium: ${severityCounts.medium}`,'','## Coverage','',`- 12-class level rows inspected: ${classMatrix.reduce((n,r)=>n+r.levels.length,0)}` ,`- Subclasses: ${subclasses.length}`,`- Species: ${species.length}`,`- Backgrounds: ${backgrounds.length}`,`- Feats: ${feats.length}`,`- Spells: ${spells.length}`,`- Items: ${items.length}`,`- Weapon mastery values: ${itemMasteries.size}`,'','## Gate','',severityCounts.critical===0?'Structural gate: GREEN. Regression tests still determine final certification.':'Structural gate: RED.'];
fs.writeFileSync(path.join(OUT,'N_MEGA3_SUMMARY.md'),md.join('\n'));
console.log(`N-MEGA3 audit written to ${path.relative(ROOT,OUT)}`);console.log(`critical=${severityCounts.critical}, high=${severityCounts.high}, medium=${severityCounts.medium}`);if(severityCounts.critical>0)process.exitCode=2;
