import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'certification-reports', 'n-mega4');
const read = (p) => fs.readFileSync(path.join(ROOT,p),'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT,p));
const findings=[];
const add=(severity,code,message,evidence={})=>findings.push({severity,code,message,evidence});

const contracts = {
  abilityScores: ['src/features/builder/Builder.tsx','src/core/character/characterIntegrity.ts','src/features/characters/characterEditorRules.ts'],
  proficiency: ['src/core/rulesets/proficiencyRules.ts','src/core/rulesets/levelOneProficiencyReadiness.ts'],
  unifiedChoices: ['src/core/rulesets/unifiedCharacterChoices.ts','src/core/rulesets/levelUpChoiceCompletion.ts','src/core/rulesets/choiceDebt.ts'],
  feats: ['src/core/rulesets/featRules.ts','src/core/rulesets/officialFeatCatalog2024.ts'],
  fightingStyle: ['src/core/rulesets/fightingStyleRules.ts'],
  expertise: ['src/core/rulesets/bardRules.ts','src/core/rulesets/rogueRules.ts'],
  invocations: ['src/core/rulesets/invocationRules.ts'],
  metamagic: ['src/core/rulesets/metamagicRules.ts'],
  maneuvers: ['src/core/rulesets/maneuverRules.ts'],
  mastery: ['src/core/rulesets/weaponMasteryRuntimeRules.ts'],
  ancestry: ['src/core/rulesets/ancestryChoiceRules.ts'],
  equipment: ['src/core/rulesets/equipmentRules.ts','src/core/rulesets/levelOneEquipmentReadiness.ts'],
  spells: ['src/core/rulesets/classSpellSelectionRules.ts','src/core/rulesets/levelOneSpellcastingReadiness.ts'],
  persistence: ['src/core/storage/characterStorage.ts','src/core/rulesets/classFeaturePersistenceBridge.ts','src/core/rulesets/spellCastingPersistenceBridge.ts'],
};
for (const [surface,files] of Object.entries(contracts)) for(const file of files) if(!exists(file)) add('critical','missing-contract',`${surface} contract missing`,{file});

const markerChecks = [
 ['src/features/builder/Builder.tsx',/point buy|pointBuy/i,'point-buy-surface'],
 ['src/features/builder/Builder.tsx',/standard array|standardArray/i,'standard-array-surface'],
 ['src/core/rulesets/proficiencyRules.ts',/skill/i,'skill-proficiency-rules'],
 ['src/core/rulesets/proficiencyRules.ts',/tool/i,'tool-proficiency-rules'],
 ['src/core/rulesets/proficiencyRules.ts',/language/i,'language-rules'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/expertise/i,'expertise-choice'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/fighting/i,'fighting-style-choice'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/invocation/i,'invocation-choice'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/metamagic/i,'metamagic-choice'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/maneuver/i,'maneuver-choice'],
 ['src/core/rulesets/unifiedCharacterChoices.ts',/mastery/i,'weapon-mastery-choice'],
 ['src/core/rulesets/featRules.ts',/prerequisite/i,'feat-prerequisites'],
 ['src/core/rulesets/classSpellSelectionRules.ts',/known|prepared/i,'known-prepared-spells'],
 ['src/core/rulesets/equipmentRules.ts',/equip/i,'equipment-choice'],
];
for(const [file,re,code] of markerChecks){if(!exists(file))continue; if(!re.test(read(file)))add('high',code,`${code} marker not found`,{file,pattern:String(re)});}

const requiredTests = [
 'src/core/rulesets/characterValidation.test.ts','src/core/rulesets/proficiencyRules.test.ts','src/core/rulesets/levelOneProficiencyReadiness.test.ts',
 'src/core/rulesets/unifiedCharacterChoices.test.ts','src/core/rulesets/levelUpChoiceCompletion.test.ts','src/core/rulesets/choiceDebt.test.ts',
 'src/core/rulesets/featRules.test.ts','src/core/rulesets/featOfficialCertification.test.ts','src/core/rulesets/fightingStyleRules.test.ts',
 'src/core/rulesets/invocationRules.test.ts','src/core/rulesets/metamagicRules.test.ts','src/core/rulesets/maneuverRules.test.ts',
 'src/core/rulesets/weaponMasteryRuntimeRules.test.ts','src/core/rulesets/ancestryChoiceRules.test.ts','src/core/rulesets/equipmentRules.test.ts',
 'src/core/rulesets/levelOneEquipmentReadiness.test.ts','src/core/rulesets/classSpellSelectionRules.test.ts','src/core/rulesets/levelOneSpellcastingReadiness.test.ts',
 'src/core/rulesets/builderProgress.test.ts','src/core/rulesets/singleClassBuilderUiRules.test.ts','src/core/rulesets/singleClassBuilderFinalCertification.integration.test.ts'
];
for(const file of requiredTests)if(!exists(file))add('high','missing-regression-test','Required builder regression test missing',{file});

const severityCounts={critical:0,high:0,medium:0,info:0}; for(const f of findings)severityCounts[f.severity]=(severityCounts[f.severity]??0)+1;
const report={schemaVersion:4,generatedAt:new Date().toISOString(),phase:'N-MEGA4',scope:'2014 and 2024 builder choice, validation and persistence closure',principle:'D&D Beyond is a capability reference only; complete copyright-safe player operation is the target.',contracts,requiredTests,severityCounts,findings};
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'N_MEGA4_BUILDER_CHOICE_VALIDATION_AUDIT.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA4_GAPS.json'),JSON.stringify(findings,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA4_SUMMARY.md'),[
 '# N-MEGA4 Builder Choice and Validation Closure','',`Generated: ${report.generatedAt}`,'','## Gate','',
 `- Critical: ${severityCounts.critical}`,`- High: ${severityCounts.high}`,`- Medium: ${severityCounts.medium}`,'',
 '## Surfaces','',...Object.entries(contracts).map(([k,v])=>`- ${k}: ${v.length} contract file(s)`),'',
 '## Meaning','','This gate verifies builder choice surfaces, validation contracts, persistence bridges and broad regression coverage. Later phases still certify individual mechanical behavior and official option completeness.'
 ].join('\n'));
console.log(`N-MEGA4 audit written to ${path.relative(ROOT,OUT)}`);
console.log(`critical=${severityCounts.critical}, high=${severityCounts.high}, medium=${severityCounts.medium}`);
if(severityCounts.critical>0)process.exitCode=2;
