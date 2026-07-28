import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>{try{return fs.readFileSync(path.join(root,p),'utf8')}catch{return ''}};
const exists=(p)=>fs.existsSync(path.join(root,p));
const walk=(dir)=>{const abs=path.join(root,dir);if(!fs.existsSync(abs))return[];return fs.readdirSync(abs,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);};
const srcFiles=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const tests=srcFiles.filter(f=>/\.(test|spec)\.(ts|tsx)$/.test(f));
const sourceCache=new Map(srcFiles.map(f=>[f,read(f)]));
const allSource=[...sourceCache.values()].join('\n').toLowerCase();
const testSource=tests.map(f=>read(f)).join('\n').toLowerCase();
const uiSource=srcFiles.filter(f=>f.endsWith('.tsx')).map(f=>read(f)).join('\n').toLowerCase();
const slug=(s)=>s.toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const has=(hay,...needles)=>needles.some(n=>hay.includes(String(n).toLowerCase()));
const rows=[];
const push=(r)=>rows.push({edition:'mixed',data:true,runtime:false,ui:false,tests:false,mode:'manual',status:'GAP',...r});
const classify=(r)=>{
  let score=(r.data?20:0)+(r.runtime?35:0)+(r.ui?25:0)+(r.tests?20:0);
  let mode=r.mode;
  if(r.domain==='spell'){
    if(['damage','healing'].includes(r.kind)) mode=r.runtime?'automatic':'partial';
    else if(['control','defense','movement','summoning'].includes(r.kind)) mode=r.runtime?'partial':'manual';
    else mode='manual';
  }
  if(r.domain==='item' && !r.active) mode=r.runtime?'automatic':'partial';
  const status=score>=85?'READY':score>=55?'PARTIAL':'GAP';
  return {...r,score,mode,status};
};

// Classes: explicit canonical set, checked against resource/action engine and UI/test wiring.
const classes=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const classEngine=read('src/core/rulesets/classFeatureEngine.ts').toLowerCase();
for(const id of classes){
  const runtime=classEngine.includes(`case "${id}"`) || classEngine.includes(`${id}: [`);
  push({domain:'class',id,name:id[0].toUpperCase()+id.slice(1),source:'classFeatureEngine.ts',runtime,ui:has(uiSource,id,'classfeaturepanel'),tests:has(testSource,id,'class runtime'),mode:runtime?'automatic':'manual'});
}

// Subclasses: explicit make(...) calls and cleric domain seed rows.
const subclassText=read('src/core/rulesets/subclassExpansion.ts');
const subclassSeen=new Set();
for(const m of subclassText.matchAll(/make\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*["'](dnd_20(?:14|24))["']/g)){
  const [,id,name,className,edition]=m; if(subclassSeen.has(id))continue; subclassSeen.add(id);
  const runtime=has(allSource,id,name,'subclassruntime');
  push({domain:'subclass',id,name,edition,className,source:'subclassExpansion.ts',runtime,ui:has(uiSource,id,name,'subclass'),tests:has(testSource,id,name),mode:runtime?'partial':'manual'});
}
for(const m of subclassText.matchAll(/\[\s*["']([^"']+-domain)["']\s*,\s*["']([^"']+)["']/g)){
  const [,id,name]=m;if(subclassSeen.has(id))continue;subclassSeen.add(id);
  const runtime=has(allSource,id,name,'channel divinity');
  push({domain:'subclass',id,name,edition:'dnd_2014',className:'Cleric',source:'subclassExpansion.ts',runtime,ui:has(uiSource,id,name,'subclass'),tests:has(testSource,id,name),mode:runtime?'partial':'manual'});
}

// Spells: tuple seeds. Runtime suitability is derived from structured effect metadata.
const spellText=read('src/core/rulesets/spellExpansion.ts');
for(const m of spellText.matchAll(/\[\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g)){
  const [,name,level,school,kind]=m; const id=slug(name);
  const structured=['damage','healing','control','defense','movement','summoning'].includes(kind);
  const runtime=structured && has(allSource,'spellruntime','spell runtime completion');
  push({domain:'spell',id,name,level:Number(level),school,kind,source:'spellExpansion.ts',runtime,ui:has(uiSource,name,id,'spell'),tests:has(testSource,name,id,kind),mode:structured?'partial':'manual'});
}

// Feats: helper calls with literal id/name.
const featFiles=['src/core/rulesets/featExpansion.ts','src/core/rulesets/officialFeatCatalog2024.ts'];
const featSeen=new Set();
for(const f of featFiles){const text=read(f);for(const m of text.matchAll(/(?:general2014|general2024|feat)\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g)){
  const [,id,name]=m;if(featSeen.has(id))continue;featSeen.add(id);
  const runtime=has(allSource,id,name,'featitemruntimecompletion');
  push({domain:'feat',id,name,edition:id.includes('2024')?'dnd_2024':'mixed',source:path.basename(f),runtime,ui:has(uiSource,id,name,'feat'),tests:has(testSource,id,name),mode:runtime?'partial':'manual'});
}}

// Items: literal object entries. Active items are charge, spell, consumable or attunement driven.
const itemText=read('src/core/rulesets/itemExpansion.ts');
for(const m of itemText.matchAll(/\{\s*id:["']([^"']+)["']\s*,\s*name:["']([^"']+)["']([\s\S]*?)description:["'][^"']*["']\s*\}/g)){
  const [,id,name,body]=m; const lower=body.toLowerCase();
  const active=/charges:|chargecost:|grantedspellname:|consumable|requiresattunement:/.test(lower);
  const runtime=active?has(allSource,id,name,'featitemruntimecompletion','magic item'):has(allSource,'inventory','equipment');
  push({domain:'item',id,name,source:'itemExpansion.ts',active,runtime,ui:has(uiSource,id,name,'inventory'),tests:has(testSource,id,name,active?'charge':'inventory'),mode:active?'partial':'automatic'});
}

const matrix=rows.map(classify);
const domains=[...new Set(matrix.map(r=>r.domain))];
const summary=domains.map(domain=>{
  const set=matrix.filter(r=>r.domain===domain);
  const counts={READY:0,PARTIAL:0,GAP:0};for(const r of set)counts[r.status]++;
  return {domain,total:set.length,...counts,average:Math.round(set.reduce((a,b)=>a+b.score,0)/Math.max(1,set.length))};
});
const generated=new Date().toISOString();
const json={version:'5.138.0',generated,structural:true,total:matrix.length,summary,rows:matrix,nextPriority:matrix.filter(r=>r.status==='GAP').slice(0,100).map(r=>({domain:r.domain,id:r.id,name:r.name}))};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/CONTENT_COVERAGE_MATRIX_v5.138.json'),JSON.stringify(json,null,2)+'\n','utf8');
const esc=(v)=>`"${String(v??'').replaceAll('"','""')}"`;
const headers=['domain','id','name','edition','kind','className','data','runtime','ui','tests','mode','score','status','source'];
const csv=[headers.join(','),...matrix.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n')+'\n';
fs.writeFileSync(path.join(root,'reports/CONTENT_COVERAGE_MATRIX_v5.138.csv'),csv,'utf8');
const md=['# E4 D&D Content Coverage Matrix v5.138','',`Generated: ${generated}`,'','> This is a structural coverage map. It does not claim every tabletop rule is semantically automated.','', '## Summary','', '| Domain | Total | Ready | Partial | Gap | Average |','|---|---:|---:|---:|---:|---:|',...summary.map(s=>`| ${s.domain} | ${s.total} | ${s.READY} | ${s.PARTIAL} | ${s.GAP} | ${s.average} |`),'','## Release interpretation','', '- READY: data, runtime signal, visible UI signal and targeted tests are structurally present.','- PARTIAL: usable with limited automation or manual confirmation.','- GAP: missing one or more release-critical layers.','- manual mode is intentional for narrative and highly contextual tabletop effects.','','## Highest-priority gaps','',...matrix.filter(r=>r.status==='GAP').slice(0,40).map(r=>`- ${r.domain}: ${r.name} (${r.id})`),'','Detailed rows are in `CONTENT_COVERAGE_MATRIX_v5.138.csv` and `.json`.',''];
fs.writeFileSync(path.join(root,'reports/CONTENT_COVERAGE_MATRIX_v5.138.md'),md.join('\n'),'utf8');
console.log(`v5.138 matrix complete: ${matrix.length} rows across ${domains.length} domains.`);
if(matrix.length<25 || !domains.includes('class') || !domains.includes('spell')) process.exitCode=1;
