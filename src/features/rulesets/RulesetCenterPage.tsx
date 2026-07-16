import { Link } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import { RULESET_DEFINITIONS } from "../../core/rulesets/rulesetRegistry";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getRulesetCoverage } from "../../core/rulesets/rulesetCoverage";

const statusLabels = {
  ready: "Temel veri hazır",
  foundation: "Altyapı hazır",
  custom: "Manuel içerik",
} as const;

export function RulesetCenterPage({ rulesetData }: { rulesetData: RulesetData | null }) {
  const { settings, updateSettings } = useAppSettings();
  const coverage = getRulesetCoverage(rulesetData);

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
        <span className="mini-label">Otomatik kapsam denetimi · %{coverage.score}</span>
        <h2>Runtime sertifikası</h2>
        <div className="ruleset-roadmap-grid">
          {coverage.rows.map((row) => <span key={row.id}><strong>{row.status === "complete" ? "✓" : row.status === "partial" ? "◐" : "○"} {row.label} · {row.count}</strong><small>{row.detail}</small></span>)}
        </div>
      </section>

      <section className="ruleset-roadmap-panel">
        <span className="mini-label">Açık içerik bildirimi</span>
        <h2>SRD 5.1 ve SRD 5.2.1</h2>
        <p>This work includes material from the System Reference Document 5.1 and System Reference Document 5.2.1 by Wizards of the Coast LLC, available at dndbeyond.com/srd. Both are licensed under the Creative Commons Attribution 4.0 International License.</p>
        <div className="ruleset-roadmap-grid"><a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">Resmî SRD kaynağı</a><a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">CC BY 4.0 lisansı</a></div>
      </section>
    </PageShell>
  );
}
