import { useMemo, useState } from "react";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
export function SubclassCatalogPage({ rulesetData }: { rulesetData: RulesetData | null }) {
 const [query,setQuery]=useState(""); const [className,setClassName]=useState("");
 const classes=rulesetData?.classes ?? [];
 const rows=useMemo(()=> (rulesetData?.subclasses ?? []).filter(x=>(!className||x.className===className)&&`${x.name} ${x.className} ${x.features.map(f=>f.name).join(" ")} ${x.bonusSpells?.join(" ") ?? ""} ${x.extraProficiencies?.join(" ") ?? ""}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))),[rulesetData,className,query]);
 return <PageShell eyebrow="Character Rules" title="Subclasses" description="2014 ve 2024 subclass yollarını class ve level akışıyla incele.">
  <div className="subclass-toolbar"><select value={className} onChange={e=>setClassName(e.target.value)}><option value="">Tüm classlar</option>{classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Subclass veya feature ara..." /></div>
  <div className="subclass-grid">{rows.map(s=><article className="subclass-card" key={s.id}><span className="mini-label">{s.className} · Level {s.selectionLevel}</span><h2>{s.name}</h2><p>{s.description}</p>{s.resourceName||s.extraProficiencies?.length||s.bonusSpells?.length?<div className="library-pill-row">{s.resourceName?<span>Resource: {s.resourceName}</span>:null}{s.extraProficiencies?.map(item=><span key={item}>{item}</span>)}{s.bonusSpells?.map(item=><span key={item}>{item}</span>)}</div>:null}<div className="subclass-feature-list">{s.features.map(f=><div key={`${f.level}-${f.name}`}><strong>L{f.level} · {f.name}</strong><span>{f.summary}</span></div>)}</div></article>)}</div>
 </PageShell>;
}
