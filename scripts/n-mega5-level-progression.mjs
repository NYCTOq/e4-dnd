import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const OUT=path.join(ROOT,'certification-reports','n-mega5');
const RULESETS=['dnd_2014','dnd_2024'];
const CORE=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const pb=l=>2+Math.floor((l-1)/4);
const asi=(name,rs)=> name==='Fighter'?[4,6,8,12,14,16,19]:name==='Rogue'?[4,8,10,12,16,19]:[4,8,12,16,19];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const gaps=[]; const rows=[];
for(const rs of RULESETS){
 const classes=read(path.join(ROOT,'public','data',rs,'classes.json'));
 for(const name of CORE){
  const c=classes.find(x=>x.name===name);
  if(!c){gaps.push({severity:'critical',ruleset:rs,className:name,issue:'missing-class'});continue;}
  const by=new Map((c.levels||[]).map(x=>[x.level,x]));
  for(let level=1;level<=20;level++){
   const r=by.get(level); const issues=[];
   if(!r) issues.push('missing-level-record');
   else {
    if(r.proficiencyBonus!==pb(level)) issues.push('incorrect-proficiency-bonus');
    if(!Array.isArray(r.features)) issues.push('missing-features-array');
    if(level>1 && !by.get(level-1)) issues.push('broken-previous-level-link');
    if(level<20 && !by.get(level+1)) issues.push('broken-next-level-link');
   }
   for(const issue of issues) gaps.push({severity:/missing-level|broken-/.test(issue)?'critical':'high',ruleset:rs,className:name,level,issue});
   rows.push({ruleset:rs,classId:c.id,className:name,level,previousLevel:level-1,proficiencyBonus:r?.proficiencyBonus??null,expectedProficiencyBonus:pb(level),features:r?.features??[],spellSlots:r?.spellSlots??[],weaponMasteryCount:r?.weaponMasteryCount??null,issues});
  }
  const unlock=c.subclassLevel;
  if(!Number.isInteger(unlock)||unlock<1||unlock>3) gaps.push({severity:'critical',ruleset:rs,className:name,issue:'invalid-subclass-level'});
  if(rs==='dnd_2024'&&unlock!==3) gaps.push({severity:'critical',ruleset:rs,className:name,issue:'2024-subclass-not-level-3'});
  for(const level of asi(name,rs)){
   const r=by.get(level); const text=(r?.features||[]).join(' ').toLowerCase();
   if(!/ability score|feat|epic boon/.test(text)) gaps.push({severity:'high',ruleset:rs,className:name,level,issue:'asi-feat-milestone-not-declared'});
  }
  if(rs==='dnd_2024'){
   const l19=by.get(19); const text=(l19?.features||[]).join(' ').toLowerCase();
   if(!/epic boon|ability score|feat/.test(text)) gaps.push({severity:'high',ruleset:rs,className:name,level:19,issue:'level-19-epic-boon-surface-missing'});
  }
 }
}
const transitions=rows.filter(x=>x.level>=2).map(x=>({ruleset:x.ruleset,classId:x.classId,className:x.className,fromLevel:x.level-1,toLevel:x.level,proficiencyBonus:x.proficiencyBonus,featuresUnlocked:x.features,spellSlots:x.spellSlots,weaponMasteryCount:x.weaponMasteryCount,issues:x.issues}));
const counts={critical:gaps.filter(x=>x.severity==='critical').length,high:gaps.filter(x=>x.severity==='high').length,medium:gaps.filter(x=>x.severity==='medium').length};
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'N_MEGA5_LEVEL_1_20_MATRIX.json'),JSON.stringify(rows,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA5_456_TRANSITIONS.json'),JSON.stringify(transitions,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA5_GAPS.json'),JSON.stringify(gaps,null,2));
const summary={schemaVersion:1,generatedAt:new Date().toISOString(),rulesets:RULESETS,classCount:24,levelRows:rows.length,transitionCount:transitions.length,counts,gate:counts.critical===0&&counts.high===0?'GREEN':'RED'};
fs.writeFileSync(path.join(OUT,'N_MEGA5_SUMMARY.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'N_MEGA5_SUMMARY.md'),`# N-MEGA5 Level 1-20 Progression\n\n- Class/ruleset combinations: ${summary.classCount}\n- Level rows: ${summary.levelRows}\n- Level transitions: ${summary.transitionCount}\n- Critical: ${counts.critical}\n- High: ${counts.high}\n- Medium: ${counts.medium}\n- Gate: ${summary.gate}\n`);
console.log(`N-MEGA5 audit: rows=${rows.length}, transitions=${transitions.length}, critical=${counts.critical}, high=${counts.high}, medium=${counts.medium}`);
if(counts.critical||counts.high) process.exitCode=1;
