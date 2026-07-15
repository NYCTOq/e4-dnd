import { Link } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import { RULESET_DEFINITIONS } from "../../core/rulesets/rulesetRegistry";

const statusLabels = {
  ready: "Temel veri hazır",
  foundation: "Altyapı hazır",
  custom: "Manuel içerik",
} as const;

export function RulesetCenterPage() {
  const { settings, updateSettings } = useAppSettings();

  return (
    <PageShell
      eyebrow="Ruleset Foundation"
      title="2014, 2024 ve Homebrew"
      description="Karakter verileri artık edition kimliğiyle saklanıyor. Böylece 2014 kurallarıyla 2024 kurallarını aynı kazanda kaynatıp ortaya mekanik çorba çıkarmıyoruz."
    >
      <section className="ruleset-center-summary">
        <div>
          <span className="mini-label">Varsayılan ruleset</span>
          <strong>{RULESET_DEFINITIONS.find((item) => item.id === settings.defaultRuleset)?.name}</strong>
          <p>Library, Spellbook ve yeni Builder taslakları bu tercihle başlar. Karakter kendi ruleset bilgisini ayrıca taşır.</p>
        </div>
        <Link to="/builder" className="primary-link">Karakter oluşturmaya geç</Link>
      </section>

      <div className="ruleset-card-grid">
        {RULESET_DEFINITIONS.map((definition) => (
          <article key={definition.id} className={settings.defaultRuleset === definition.id ? "ruleset-card active" : "ruleset-card"}>
            <div className="ruleset-card-head">
              <div>
                <span className="mini-label">{definition.editionLabel}</span>
                <h2>{definition.name}</h2>
              </div>
              <span className={`ruleset-status ${definition.readiness}`}>{statusLabels[definition.readiness]}</span>
            </div>
            <dl className="ruleset-facts">
              <div><dt>Karakter kökeni</dt><dd>{definition.raceTerm}</dd></div>
              <div><dt>Ability kaynağı</dt><dd>{definition.backgroundAbilitySource ? "Background" : definition.id === "homebrew" ? "Custom" : "Race"}</dd></div>
              <div><dt>Subclass modeli</dt><dd>{definition.subclassLevelMode === "level-3" ? "Level 3 standardı" : definition.subclassLevelMode === "class-defined" ? "Class tablosuna göre" : "Manuel"}</dd></div>
              <div><dt>Weapon Mastery</dt><dd>{definition.supportsWeaponMastery ? "Desteklenecek" : "Yok / manuel"}</dd></div>
            </dl>
            <ul className="ruleset-note-list">{definition.notes.map((note) => <li key={note}>{note}</li>)}</ul>
            <button
              type="button"
              className={settings.defaultRuleset === definition.id ? "secondary-button" : "primary-button"}
              disabled={settings.defaultRuleset === definition.id}
              onClick={() => updateSettings({ defaultRuleset: definition.id })}
            >
              {settings.defaultRuleset === definition.id ? "Varsayılan" : "Varsayılan yap"}
            </button>
          </article>
        ))}
      </div>

      <section className="ruleset-roadmap-panel">
        <span className="mini-label">Sıradaki veri katmanları</span>
        <h2>Temel artık edition-aware</h2>
        <div className="ruleset-roadmap-grid">
          <Link to="/classes">Classes + level tables</Link><span>Races / Species</span><span>Backgrounds</span>
          <span>Subclasses</span><span>Feats</span><span>Spells + equipment</span>
        </div>
      </section>
    </PageShell>
  );
}
