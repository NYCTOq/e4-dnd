import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root,p));
const read = (p) => exists(p) ? fs.readFileSync(path.join(root,p),'utf8') : '';
const walk = (dir) => {
  const abs=path.join(root,dir); if(!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
};
const srcFiles=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const testFiles=srcFiles.filter(f=>/\.(test|spec)\.(ts|tsx)$/.test(f));
const domains=[
 ['Class','src/core/rulesets/classFeatureEngine.ts',['classFeatureRuntime','classFeaturePersistenceBridge','ClassFeaturePanel']],
 ['Subclass','src/core/rulesets/subclassRuntimeRules.ts',['classSubclassRuntimeRules','Subclass','subclass']],
 ['Spell','src/core/rulesets/spellRuntimeCompletion.ts',['spellRuntime','SpellCasting','concentration']],
 ['Feat','src/core/rulesets/featItemRuntimeCompletion.ts',['feat','Feat']],
 ['Item','src/core/rulesets/featItemRuntimeCompletion.ts',['item','Inventory','attunement','charge']],
 ['Session','src/core/runtime/sessionPlayLoop.ts',['sessionPlayLoop','Session','PlayMode']],
 ['Manual bridge','src/core/runtime/manualRuntimeBridge.ts',['manualRuntimeBridge','Manual Runtime','manual effect']],
];
function domainResult([name,primary,tokens]){
 const runtime=exists(primary) || srcFiles.some(f=>tokens.some(t=>f.toLowerCase().includes(t.toLowerCase())));
 const ui=srcFiles.some(f=>/\.tsx$/.test(f)&&tokens.some(t=>read(f).toLowerCase().includes(t.toLowerCase())));
 const tests=testFiles.filter(f=>tokens.some(t=>(f+' '+read(f)).toLowerCase().includes(t.toLowerCase()))).length;
 const score=(runtime?40:0)+(ui?30:0)+(tests?30:0);
 return {name,runtime,ui,tests,score,status:score>=90?'READY':score>=60?'PARTIAL':'GAP'};
}
const results=domains.map(domainResult);
const critical=[
 ['Character builder',srcFiles.some(f=>/Builder\.tsx$/.test(f))],
 ['Play mode',srcFiles.some(f=>/PlayMode\.tsx$/.test(f))],
 ['Backup recovery',srcFiles.some(f=>/DataBackup\.tsx$/.test(f))],
 ['PWA manifest',exists('public/manifest.webmanifest')||exists('vite.config.ts')],
 ['Release scripts',exists('scripts/audit-release-artifacts-v5.128.mjs')],
];
const avg=Math.round(results.reduce((a,b)=>a+b.score,0)/results.length);
const gaps=results.filter(r=>r.status!=='READY');
const generated=new Date().toISOString();
const json={version:'5.137.0',generated,averageScore:avg,domains:results,criticalChecks:critical.map(([name,passed])=>({name,passed})),nextPriority:gaps.map(g=>g.name)};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/FULL_PLAYABILITY_AUDIT_v5.137.json'),JSON.stringify(json,null,2)+'\n');
const lines=[
 '# E4 D&D Full Playability Audit v5.137','',`Generated: ${generated}`,`Overall readiness score: **${avg}/100**`,'',
 '## Domain matrix','', '| Domain | Runtime | UI | Tests | Score | Status |','|---|---:|---:|---:|---:|---|',
 ...results.map(r=>`| ${r.name} | ${r.runtime?'yes':'no'} | ${r.ui?'yes':'no'} | ${r.tests} | ${r.score} | ${r.status} |`),
 '', '## Critical product checks','', ...critical.map(([n,p])=>`- ${p?'PASS':'FAIL'}: ${n}`),
 '', '## Next priorities','', ...(gaps.length?gaps.map(g=>`- ${g.name}: ${g.status}, score ${g.score}`):['- No structural gaps detected. Continue with content coverage matrix.']),
 '', '## Interpretation','',
 '- READY means runtime, visible UI wiring and targeted tests were all detected.',
 '- PARTIAL means the domain exists but one layer is weak or missing.',
 '- GAP means the domain cannot yet be treated as release-ready.',
 '- This is a structural audit, not proof that every individual D&D rule is fully automated.',''
];
fs.writeFileSync(path.join(root,'reports/FULL_PLAYABILITY_AUDIT_v5.137.md'),lines.join('\n'));
console.log(`v5.137 audit complete: ${avg}/100; ${gaps.length} non-ready domains.`);
if(critical.some(([,p])=>!p)) process.exitCode=1;
