import { Link } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import { RULESET_DEFINITIONS } from "../../core/rulesets/rulesetRegistry";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getRulesetCoverage } from "../../core/rulesets/rulesetCoverage";
import { getLevel20Certification } from "../../core/rulesets/level20Certification";
import { getRuntimeCoverageCertification } from "../../core/rulesets/runtimeCoverageCertification";
import { getContentIntegrityAudit } from "../../core/rulesets/contentIntegrityAudit";
import { getContentCompletionPlan } from "../../core/rulesets/contentCompletionPolicy";

const statusLabels = {
  ready: "Temel veri hazır",
  foundation: "Altyapı hazır",
  custom: "Manuel içerik",
} as const;

export function RulesetCenterPage({ rulesetData }: { rulesetData: RulesetData | null }) {
  const { settings, updateSettings } = useAppSettings();
  const coverage = getRulesetCoverage(rulesetData);
  const certification=getLevel20Certification(rulesetData);
  const runtimeCertification=getRuntimeCoverageCertification(rulesetData);
  const contentAudit = getContentIntegrityAudit(rulesetData);
  const completionPlan = getContentCompletionPlan(rulesetData, contentAudit);

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

      <section className="ruleset-roadmap-panel" data-testid="content-completion-plan">
        <span className="mini-label">Catalog Completion · %{completionPlan.score}</span>
        <h2>{completionPlan.state === "complete" ? "Katalog hedefleri tamamlandı" : completionPlan.state === "usable" ? "Katalog kullanılabilir, inceleme gerekiyor" : "Katalog tamamlama blocker'ları var"}</h2>
        <div className="ruleset-roadmap-grid">
          {completionPlan.targets.map((target) => <span key={target.id}><strong>{target.state === "complete" ? "✓" : target.state === "usable" ? "◐" : "✕"} {target.label} · {target.current}/{target.minimum}</strong><small>{target.detail}</small></span>)}
        </div>
        {completionPlan.compatibilityEntities.length ? <p><strong>Compatibility stat block:</strong> {completionPlan.compatibilityEntities.join(", ")}</p> : null}
        {completionPlan.blockers.length ? <details open><summary>Blocker · {completionPlan.blockers.length}</summary><ul className="ruleset-note-list">{completionPlan.blockers.map((entry) => <li key={entry}>{entry}</li>)}</ul></details> : null}
        {completionPlan.reviewItems.length ? <details><summary>İnceleme listesi · {completionPlan.reviewItems.length}</summary><ul className="ruleset-note-list">{completionPlan.reviewItems.map((entry) => <li key={entry}>{entry}</li>)}</ul></details> : null}
      </section>

      <section className="ruleset-roadmap-panel" data-testid="content-integrity-audit">
        <span className="mini-label">Full Content Integrity · %{contentAudit.score}</span>
        <h2>{contentAudit.status === "certified" ? "Katalog bütünlüğü sertifikalı" : contentAudit.status === "review" ? "Katalog incelemesi gerekiyor" : "Katalog blocker'ları bulundu"}</h2>
        <p>{contentAudit.totalEntities} içerik kaydı · {contentAudit.blockerCount} blocker · {contentAudit.warningCount} uyarı</p>
        <div className="ruleset-roadmap-grid">
          {contentAudit.catalogs.map((catalog) => (
            <span key={catalog.id}>
              <strong>{catalog.status === "pass" ? "✓" : catalog.status === "warning" ? "◐" : "✕"} {catalog.label} · {catalog.count}</strong>
              <small>{catalog.blockers} blocker · {catalog.warnings} uyarı</small>
            </span>
          ))}
        </div>
        {contentAudit.missingCatalogs.length ? <p><strong>Boş kataloglar:</strong> {contentAudit.missingCatalogs.join(", ")}</p> : null}
        {contentAudit.issues.length ? (
          <details>
            <summary>İçerik ve referans raporu · {contentAudit.issues.length}</summary>
            <ul className="ruleset-note-list">
              {contentAudit.issues.map((entry) => (
                <li key={entry.id}><strong>{entry.severity.toUpperCase()}</strong> · {entry.entity ? `${entry.entity}: ` : ""}{entry.message}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section className="ruleset-roadmap-panel">
        <span className="mini-label">Açık içerik bildirimi</span>
        <h2>SRD 5.1 ve SRD 5.2.1</h2>
        <p>This work includes material from the System Reference Document 5.1 and System Reference Document 5.2.1 by Wizards of the Coast LLC, available at dndbeyond.com/srd. Both are licensed under the Creative Commons Attribution 4.0 International License.</p>
        <div className="ruleset-roadmap-grid"><a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">Resmî SRD kaynağı</a><a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">CC BY 4.0 lisansı</a></div>
      </section>
      <section className="ruleset-roadmap-panel"><span className="mini-label">Level 1–20 Certification · %{certification.score}</span><h2>{certification.certified?"Oynanış matrisi sertifikalı":"Kontrol gereken bloklar var"}</h2><div className="ruleset-roadmap-grid">{certification.checks.map(check=><span key={check.id}><strong>{check.status==="pass"?"✓":check.status==="warning"?"◐":"✕"} {check.label}</strong><small>{check.detail}</small></span>)}</div><details><summary>12 Class Matrisi</summary><div className="ruleset-roadmap-grid">{certification.classes.map(item=><span key={item.className}><strong>{item.ready?"✓":"✕"} {item.className}</strong><small>{item.coveredLevels}/20 level · {item.subclassCount} subclass</small></span>)}</div></details>{certification.blockers.length?<details><summary>Blocker raporu · {certification.blockers.length}</summary><ul className="ruleset-note-list">{certification.blockers.map((blocker,index)=><li key={`${blocker}-${index}`}>{blocker}</li>)}</ul></details>:null}</section>
      <section className="ruleset-roadmap-panel"><span className="mini-label">Runtime Coverage Certification · %{runtimeCertification.score}</span><h2>{runtimeCertification.status==="certified"?"Mekanik kapsam ölçüldü":"Runtime boşlukları kapatılmalı"}</h2><p>Automatic doğrudan hesaplanır; Assisted sistem yönlendirir; Manual oyuncu/DM tarafından uygulanır; Missing henüz tanımlı değildir.</p><div className="ruleset-roadmap-grid">{runtimeCertification.categories.map(group=><span key={group.id}><strong>{group.label} · %{group.score}</strong><small>{group.total} toplam · {group.automatic} Automatic · {group.assisted} Assisted · {group.manual} Manual · {group.missing} Missing</small></span>)}</div>{runtimeCertification.categories.map(group=><details key={group.id}><summary>{group.label} detayları · {group.total}</summary><ul className="ruleset-note-list">{group.entities.map(entity=><li key={entity.id}><strong>{entity.tier.toUpperCase()}</strong> · {entity.name} — {entity.reason}</li>)}</ul></details>)}{runtimeCertification.priorities.length?<details open><summary>Öncelikli runtime açıkları · {runtimeCertification.priorities.length}</summary><ul className="ruleset-note-list">{runtimeCertification.priorities.map(item=><li key={item}>{item}</li>)}</ul></details>:null}</section>
    </PageShell>
  );
}
