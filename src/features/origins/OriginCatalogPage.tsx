import { useMemo, useState } from "react";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";

export function OriginCatalogPage({ rulesetData }: { rulesetData: RulesetData | null }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  const races = useMemo(() => (rulesetData?.races ?? []).filter((item) => !normalized || `${item.name} ${item.description} ${item.traits.join(" ")}`.toLocaleLowerCase("tr-TR").includes(normalized)), [rulesetData, normalized]);
  const backgrounds = useMemo(() => (rulesetData?.backgrounds ?? []).filter((item) => !normalized || `${item.name} ${item.description} ${item.skillProficiencies.join(" ")} ${item.originFeat ?? ""}`.toLocaleLowerCase("tr-TR").includes(normalized)), [rulesetData, normalized]);
  const raceTerm = rulesetData?.id === "dnd_2024" ? "Species" : "Races";

  return <PageShell eyebrow="Character Origins" title={`${raceTerm} + Backgrounds`} description="2014 race bonusları ile 2024 species ve origin background kuralları ayrı veri katmanlarında gösteriliyor.">
    <section className="origin-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Race, species, trait, background veya feat ara..." /><span>{races.length} {raceTerm.toLowerCase()} · {backgrounds.length} background</span></section>
    {!rulesetData ? <div className="empty-panel"><h2>Ruleset verisi bekleniyor</h2><p>Önce 2014 veya 2024 ruleset seçimi yüklenmeli.</p></div> : <div className="origin-catalog-grid">
      <section><div className="panel-heading-row"><div><span className="mini-label">{rulesetData.name}</span><h2>{raceTerm}</h2></div></div><div className="origin-card-list">{races.map((race) => <article className="origin-card" key={race.id}><div><span className="mini-label">{race.size} · {race.speed} ft</span><h3>{race.name}</h3><p>{race.description}</p></div><div className="preview-stats">{Object.entries(race.abilityBonuses).length ? <span>{Object.entries(race.abilityBonuses).map(([key,value]) => `${key.toUpperCase()} +${value}`).join(", ")}</span> : <span>Ability bonus: background</span>}{race.darkvision ? <span>Darkvision {race.darkvision} ft</span> : null}</div><ul>{race.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>{race.subraces?.length ? <div className="origin-subrace-list">{race.subraces.map((subrace) => <span key={subrace.id}>{subrace.name}</span>)}</div> : null}</article>)}</div></section>
      <section><div className="panel-heading-row"><div><span className="mini-label">Origin</span><h2>Backgrounds</h2></div></div><div className="origin-card-list">{backgrounds.map((background) => <article className="origin-card" key={background.id}><div><span className="mini-label">Background</span><h3>{background.name}</h3><p>{background.description}</p></div><div className="preview-stats"><span>Skills {background.skillProficiencies.join(", ")}</span>{background.feature ? <span>Feature {background.feature}</span> : null}{background.originFeat ? <span>Origin Feat {background.originFeat}</span> : null}{background.abilityOptions?.length ? <span>Abilities {background.abilityOptions.map((item) => item.toUpperCase()).join(", ")}</span> : null}</div></article>)}</div></section>
    </div>}
  </PageShell>;
}
