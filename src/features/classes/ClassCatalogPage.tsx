import { useMemo, useState } from "react";
import { PageShell } from "../../shared/layout/PageShell";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { formatSpellSlots } from "../../core/rulesets/classProgression";

export function ClassCatalogPage({ rulesetData }: { rulesetData: RulesetData | null }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const classes = useMemo(() => (rulesetData?.classes ?? []).filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))), [query, rulesetData]);
  const selected = classes.find((item) => item.id === selectedId) ?? classes[0] ?? null;

  return (
    <PageShell eyebrow="Character Foundation" title="Classes + Level Tables" description="2014 ve 2024 class progression verilerini edition bazında incele. Hit Die, save proficiency, subclass seviyesi, spell slotları ve level feature akışı artık ayrı veri katmanlarından geliyor.">
      <section className="class-catalog-toolbar">
        <div><span className="mini-label">Aktif ruleset</span><strong>{rulesetData?.name ?? "Yükleniyor"}</strong></div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Class ara..." aria-label="Class ara" />
      </section>
      <div className="class-catalog-layout">
        <aside className="class-catalog-list" aria-label="Class listesi">
          {classes.map((item) => <button type="button" key={item.id} className={selected?.id === item.id ? "active" : ""} onClick={() => setSelectedId(item.id)}><strong>{item.name}</strong><span>d{item.hitDie} · Subclass L{item.subclassLevel}</span></button>)}
        </aside>
        {selected ? <section className="class-catalog-detail">
          <header><div><span className="mini-label">{selected.spellProgression} progression</span><h2>{selected.name}</h2><p>{selected.description}</p></div><div className="class-stat-pills"><span>Hit Die d{selected.hitDie}</span><span>Subclass L{selected.subclassLevel}</span><span>{selected.levels.length} level</span></div></header>
          <div className="class-facts-grid"><div><span>Primary</span><strong>{selected.primaryAbilities.map((a) => a.toUpperCase()).join(" / ")}</strong></div><div><span>Saves</span><strong>{selected.savingThrows.map((a) => a.toUpperCase()).join(" / ")}</strong></div><div><span>Skills</span><strong>{selected.skillChoices.choose} seçim</strong></div><div><span>Spell ability</span><strong>{selected.spellcastingAbility?.toUpperCase() ?? "Yok"}</strong></div></div>
          <div className="class-level-table-wrap"><table className="class-level-table"><thead><tr><th>Level</th><th>PB</th><th>Features</th><th>Spell slots / Pact</th><th>Mastery</th></tr></thead><tbody>{selected.levels.map((row) => <tr key={row.level}><td>{row.level}</td><td>+{row.proficiencyBonus}</td><td>{row.features.join(", ") || "—"}</td><td>{row.pactMagic ? `${row.pactMagic.slots} × L${row.pactMagic.slotLevel}` : formatSpellSlots(row.spellSlots)}</td><td>{row.weaponMasteryCount ?? "—"}</td></tr>)}</tbody></table></div>
        </section> : <div className="empty-panel"><h2>Class bulunamadı</h2><p>Aktif ruleset için class verisi yok.</p></div>}
      </div>
    </PageShell>
  );
}
