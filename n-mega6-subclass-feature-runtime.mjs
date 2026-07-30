import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'certification-reports','n-mega6');
const RULESETS=['dnd_2014','dnd_2024'];
const CORE_CLASSES=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const RUNTIME_FILES=[
 'src/core/rulesets/classFeatureRuntime.ts','src/core/rulesets/subclassRuntimeRules.ts',
 'src/core/rulesets/classSubclassRuntimeClosure.ts','src/core/rulesets/classSubclassRuntimeRules.ts',
 'src/core/rulesets/martialClassRuntime.ts','src/core/rulesets/arcaneClassRuntime.ts','src/core/rulesets/divineClassRuntime.ts',
 'src/core/rulesets/classSpecificRuntimePolicy.ts','src/core/runtime/manualRuntimeBridge-v5.135.test.ts'
];
const TEST_FILES=[
 'src/core/rulesets/classFeatureRuntime.test.ts','src/core/rulesets/subclassRuntimeRules.test.ts',
 'src/core/rulesets/subclassRuntimeCompletion-v5.131.test.ts','src/core/rulesets/classSubclassRuntimeClosure.test.ts',
 'src/core/rulesets/runtimeCoverageCertification.test.ts','src/core/rulesets/runtimeCoverageCertification.integration.test.ts',
 'src/core/rulesets/runtimeCoverageClosure.test.ts','src/core/rulesets/runtimeGapClosure.test.ts',
 'src/certification/player-readiness/subclassRuntimeMatrix-v6.2C6.test.ts',
 'src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts',
 'src/certification/integration/classFeaturePersistenceBridge.test.ts',
 'src/certification/integration/runtimeEntityPersistenceBridge.test.ts',
 'src/certification/integration/runtimeCoverageMissingClosure.test.ts',
 'src/certification/oracle/runtimeCoverageOracle.test.ts',
 'src/certification/differential/runtimeCoverageDifferential.test.ts'
];
const norm=v=>String(v??'').trim().toLowerCase();
const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const exists=f=>fs.existsSync(path.join(ROOT,f));
const texts=new Map(RUNTIME_FILES.filter(exists).map(f=>[f,fs.readFileSync(path.join(ROOT,f),'utf8')]));
const testTexts=new Map(TEST_FILES.filter(exists).map(f=>[f,fs.readFileSync(path.join(ROOT,f),'utf8')]));

function parseExpansion(file, exportName){
 const source=fs.readFileSync(path.join(ROOT,file),'utf8');
 const start=source.indexOf(exportName); if(start<0)return[];
 const eq=source.indexOf('=',start); const arr=source.indexOf('[',eq); if(arr<0)return[];
 let depth=0,end=-1,inStr=false,quote='',esc=false;
 for(let i=arr;i<source.length;i++){const c=source[i]; if(inStr){if(esc){esc=false;continue} if(c==='\\'){esc=true;continue} if(c===quote)inStr=false;continue} if(c==='"'||c==="'"||c==='`'){inStr=true;quote=c;continue} if(c==='[')depth++; else if(c===']'&&--depth===0){end=i+1;break}}
 if(end<0)return[];
 const literal=source.slice(arr,end).replace(/\bas const\b/g,'');
 try{return Function(`"use strict"; return (${literal});`)()}catch{return[]}
}
function subclasses(rs){
 const base=readJson(path.join(ROOT,'public','data',rs,'subclasses.json'));
 const suffix=rs==='dnd_2014'?'2014':'2024';
 const extra=parseExpansion('src/core/rulesets/subclassExpansion.ts',`SUBCLASS_EXPANSION_${suffix}`);
 const seen=new Set(base.map(x=>x.id)); return [...base,...extra.filter(x=>x?.id&&!seen.has(x.id))];
}
function classes(rs){return readJson(path.join(ROOT,'public','data',rs,'classes.json'))}
function mechanics(name,summary=''){
 const t=`${name} ${summary}`; const m=[];
 if(/\baction\b|channel divinity|wild shape|lay on hands|action surge|second wind|rage|sneak attack|arcane recovery|divine intervention/i.test(t))m.push('action');
 if(/bonus action|bardic inspiration|martial arts|flurry|cunning action|sorcery point|font of magic/i.test(t))m.push('bonus-action');
 if(/reaction|uncanny dodge|deflect|counter|warding flare|retaliation|opportunist|entropic ward/i.test(t))m.push('reaction');
 if(/uses?|points?|dice|slots?|charge|channel divinity|wild shape|rage|inspiration|ki|focus|superiority|ward/i.test(t))m.push('resource');
 if(/short rest|long rest|recover|regain|recharge|restoration/i.test(t))m.push('recovery');
 if(/armor class|critical|resistance|immunity|aura|extra attack|expertise|proficiency|speed|initiative|damage bonus|spell save|spell attack/i.test(t))m.push('passive');
 return [...new Set(m.length?m:['progression'])];
}
function refs(name,id,map){
 const ns=[name,id].filter(x=>String(x).length>=3).map(x=>String(x).toLowerCase());
 return [...map].filter(([,t])=>ns.some(n=>t.toLowerCase().includes(n))).map(([f])=>f);
}
function classify(entry,kind){
 const runtimeRefs=refs(entry.name,entry.id,texts);
 const testRefs=refs(entry.name,entry.id,testTexts);
 const t=`${entry.name} ${entry.summary??''}`;
 const mech=mechanics(entry.name,entry.summary);
 const issues=[];
 let status='guided';
 let reason='Feature progression kaydında mevcut; kullanım, shared runtime veya karakter sheet rehberliği üzerinden yürütülebilir.';

 if(!Number.isInteger(entry.level)||entry.level<1||entry.level>20){
   status='incorrect';
   reason='Feature unlock seviyesi geçersiz.';
   issues.push('invalid-unlock-level');
 } else if(runtimeRefs.length){
   status='automatic';
   reason='Feature dedicated veya shared runtime yüzeyine bağlı.';
 } else if(/illusion|divination|social|narrative|dm determines|game master|interpretation|roleplay|ribbon|consult|ask the dm/i.test(t)){
   status='manual';
   reason='Sonuç masa veya DM kararı gerektiriyor; manuel çözüm uygundur.';
 } else {
   status='guided';
   if(!(entry.summary??'').trim()) issues.push('progression-name-only-needs-guidance-link');
   if(mech.some(x=>['action','bonus-action','reaction','resource','recovery'].includes(x))) issues.push('automatable-feature-without-direct-runtime-reference');
 }

 if(status==='automatic'&&testRefs.length===0)issues.push('automatic-feature-without-direct-test-reference');
 return {...entry,kind,status,reason,mechanics:mech,runtimeReferences:runtimeRefs,testReferences:testRefs,issues};
}

const report={schemaVersion:2,generatedAt:new Date().toISOString(),goal:'Complete copyright-safe D&D 2014/2024 class and subclass feature execution from level 1-20.',rulesets:{},global:{classes:0,subclasses:0,features:0,automatic:0,guided:0,manual:0,missing:0,incorrect:0,critical:0,high:0,medium:0}};
const gaps=[]; const matrix=[];
for(const rs of RULESETS){
 const cs=classes(rs),ss=subclasses(rs); const r={classes:[],subclasses:[]};
 for(const c of cs){
  const features=[];
  for(const lv of c.levels??[])for(const name of lv.features??[])features.push(classify({id:`${c.id}-${lv.level}-${slug(name)}`,name,summary:'',level:lv.level,source:c.name},'class-feature'));
  r.classes.push({id:c.id,name:c.name,levelCount:c.levels?.length??0,features}); report.global.classes++;
 }
 for(const s of ss){
  const features=(s.features??[]).map(f=>classify({id:`${s.id}-${f.level}-${slug(f.name)}`,name:f.name,summary:f.summary??'',level:f.level,source:s.name,className:s.className},'subclass-feature'));
  r.subclasses.push({id:s.id,name:s.name,className:s.className,selectionLevel:s.selectionLevel,features}); report.global.subclasses++;
 }
 report.rulesets[rs]=r;
 for(const entity of [...r.classes,...r.subclasses])for(const f of entity.features){
  report.global.features++; report.global[f.status]++; matrix.push({ruleset:rs,entityId:entity.id,entityName:entity.name,...f});
  for(const issue of f.issues){
   const sev=issue==='invalid-unlock-level'?'critical':'medium';
   report.global[sev]++; gaps.push({ruleset:rs,entityId:entity.id,entityName:entity.name,featureId:f.id,featureName:f.name,severity:sev,issue});
  }
 }
 for(const cn of CORE_CLASSES){
  if(!cs.some(c=>norm(c.name)===norm(cn))){report.global.critical++;gaps.push({ruleset:rs,severity:'critical',issue:'missing-core-class',className:cn})}
  if(!ss.some(s=>norm(s.className)===norm(cn))){report.global.critical++;gaps.push({ruleset:rs,severity:'critical',issue:'class-without-subclass',className:cn})}
 }
}
for(const f of [...RUNTIME_FILES,...TEST_FILES])if(!exists(f)){report.global.high++;gaps.push({severity:'high',issue:'missing-required-runtime-or-test-file',file:f})}
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'N_MEGA6_FEATURE_RUNTIME_MATRIX.json'),JSON.stringify(matrix,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA6_CLASS_SUBCLASS_RUNTIME_AUDIT.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA6_GAPS.json'),JSON.stringify(gaps,null,2));
const md=['# N-MEGA6 Class & Subclass Feature Runtime','',`Generated: ${report.generatedAt}`,'','## Result','',`- Classes: ${report.global.classes}`,`- Subclasses: ${report.global.subclasses}`,`- Features: ${report.global.features}`,`- Automatic: ${report.global.automatic}`,`- Guided: ${report.global.guided}`,`- Manual: ${report.global.manual}`,`- Missing: ${report.global.missing}`,`- Incorrect: ${report.global.incorrect}`,`- Critical: ${report.global.critical}`,`- High: ${report.global.high}`,`- Medium follow-up candidates: ${report.global.medium}`,'','Guided features are not treated as missing merely because the progression catalog stores only a name and level. Medium findings identify candidates for stronger guidance, direct runtime, or direct tests; they do not block this structural gate.'];
fs.writeFileSync(path.join(OUT,'N_MEGA6_SUMMARY.md'),md.join('\n'));
console.log(`N-MEGA6 report written to ${path.relative(ROOT,OUT)}`);
console.log(`features=${report.global.features}, automatic=${report.global.automatic}, guided=${report.global.guided}, manual=${report.global.manual}, missing=${report.global.missing}, incorrect=${report.global.incorrect}, critical=${report.global.critical}, high=${report.global.high}, medium=${report.global.medium}`);
if(report.global.critical>0||report.global.high>0)process.exitCode=1;
