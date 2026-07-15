import { useMemo, useState } from "react";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";

const EMPTY_FEATS: RulesetData["feats"] = [];

export function FeatCatalogPage({ rulesetData }: { rulesetData: RulesetData | null }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "origin" | "general" | "epic-boon">("all");
  const feats = rulesetData?.feats ?? EMPTY_FEATS;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return feats.filter((feat) => {
      if (category !== "all" && feat.category !== category) return false;
      if (!normalized) return true;
      return [feat.name, feat.summary, ...feat.benefits]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalized);
    });
  }, [category, feats, query]);

  return (
    <PageShell
      eyebrow="Character Options"
      title="Feats"
      description="Origin, general ve epic boon seçeneklerini ruleset bazında incele. Katalog var diye prerequisite'ler buharlaşmıyor, ne yazık ki kurallar hâlâ mevcut."
    >
      <section className="form-panel">
        <div className="form-grid">
          <label>
            Feat ara
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="War Caster, Tough..." />
          </label>
          <label>
            Kategori
            <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
              <option value="all">Tümü</option>
              <option value="origin">Origin</option>
              <option value="general">General</option>
              <option value="epic-boon">Epic Boon</option>
            </select>
          </label>
        </div>
      </section>

      <section className="builder-choice-grid">
        {filtered.map((feat) => (
          <article className="builder-choice-card" key={feat.id}>
            <span className="mini-label">{feat.category} · {feat.ruleset === "dnd_2024" ? "2024" : "2014"}</span>
            <h2>{feat.name}</h2>
            <p>{feat.summary}</p>
            <div className="preview-stats">
              {feat.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
              {feat.prerequisite?.minimumLevel ? <span>Level {feat.prerequisite.minimumLevel}+</span> : null}
              {feat.prerequisite?.spellcasting ? <span>Spellcasting prerequisite</span> : null}
              {feat.prerequisite?.abilityMinimums ? <span>{Object.entries(feat.prerequisite.abilityMinimums).map(([ability, score]) => `${ability.toUpperCase()} ${score}`).join(", ")}</span> : null}
            </div>
          </article>
        ))}
      </section>

      {!filtered.length ? <div className="empty-panel"><h2>Feat bulunamadı</h2><p>Filtreyi biraz gevşet. Kurallar yeterince katı zaten.</p></div> : null}
    </PageShell>
  );
}
