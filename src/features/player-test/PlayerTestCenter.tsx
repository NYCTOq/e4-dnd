import { useMemo, useState } from "react";
import packageInfo from "../../../package.json";
import type { Character } from "../../core/character/character.types";
import { createPlayerTestReport, downloadPlayerTestReport, type PlayerFeedback } from "../../core/release/playerTestReport";
import { getReleaseReadiness } from "../../core/release/releaseReadiness";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";
import { PageShell } from "../../shared/layout/PageShell";

const STORAGE_KEY = "e4_dnd_player_test_checklist_v1";
const SCENARIOS = [
  ["create-2014", "2014 martial karakter oluştur ve kaydet"],
  ["create-2024", "2024 spellcaster karakter oluştur ve kaydet"],
  ["level-up", "Level up, ASI ve feat seçimlerini tamamla"],
  ["multiclass", "Multiclass ekle; slot ve Hit Dice havuzlarını kontrol et"],
  ["combat", "Attack, spell, concentration, Short/Long Rest akışını oyna"],
  ["equipment", "Ekipman, attunement, charge ve consumable kullan"],
  ["backup", "Tam yedek indir, içe aktar ve karakteri yeniden aç"],
  ["offline", "Uygulamayı çevrimdışı yeniden yükle"],
  ["mobile", "Dar mobil ekranda ana oyuncu akışlarını tamamla"],
  ["keyboard", "Yalnızca klavye ile gezin; görünür odağı kontrol et"],
] as const;
const blankFeedback: PlayerFeedback = { category: "Karakter oluşturma", severity: "Orta", steps: "", expected: "", actual: "", device: "" };

export function PlayerTestCenter({ characters, rulesetData }: { characters: Character[]; rulesetData: RulesetData | null }) {
  const readiness = useMemo(() => getReleaseReadiness(characters, rulesetData), [characters, rulesetData]);
  const [completed, setCompleted] = useState<string[]>(() => readJsonSafely<string[]>(STORAGE_KEY, [], (value): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string")));
  const [feedback, setFeedback] = useState(blankFeedback);
  const toggle = (id: string) => setCompleted((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeJsonSafely(STORAGE_KEY, next);
    return next;
  });
  const update = (key: keyof PlayerFeedback, value: string) => setFeedback((current) => ({ ...current, [key]: value }));
  const exportReport = () => downloadPlayerTestReport(createPlayerTestReport({ appVersion: packageInfo.version, characters, rulesetData, feedback }));

  return <PageShell eyebrow="Release candidate" title="Oyuncu Test Merkezi" description="Gerçek oyuncu testini aynı senaryolarla yürüt, otomatik denetimleri gör ve kişisel karakter notlarını içermeyen tanı raporu üret.">
    <div className="player-test-summary">
      <article className={`player-test-score ${readiness.status}`}><span>Release hazırlığı</span><strong>{readiness.score}/100</strong><small>{readiness.status === "ready" ? "Otomatik kontroller hazır" : "Dikkat isteyen kontroller var"}</small></article>
      <article><span>Manuel senaryolar</span><strong>{completed.length}/{SCENARIOS.length}</strong><small>Gerçek cihaz/oyuncu tarafından işaretlenir</small></article>
      <article><span>Karakter örnekleri</span><strong>{characters.length}</strong><small>İsimler tanı raporuna eklenmez</small></article>
    </div>
    <section className="player-test-panel"><h2>Otomatik hazır olma denetimi</h2><div className="player-test-check-grid">{readiness.checks.map((check) => <article key={check.id} className={`release-check ${check.status}`}><span aria-hidden="true">{check.status === "pass" ? "✓" : check.status === "warning" ? "!" : "×"}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></article>)}</div>{readiness.blockers.length > 0 && <details><summary>{readiness.blockers.length} engel/dikkat noktası</summary><ul>{readiness.blockers.map((blocker, index) => <li key={`${blocker}-${index}`}>{blocker}</li>)}</ul></details>}</section>
    <section className="player-test-panel"><h2>Oyuncu senaryo listesi</h2><p className="muted">Bu kutular otomatik test değildir; test eden kişinin gerçekten tamamladığını kaydeder.</p><div className="player-test-scenarios">{SCENARIOS.map(([id, label]) => <label key={id}><input type="checkbox" checked={completed.includes(id)} onChange={() => toggle(id)} /><span>{label}</span></label>)}</div></section>
    <section className="player-test-panel"><h2>Hata notu ve güvenli tanı raporu</h2><div className="player-test-form"><label>Kategori<select value={feedback.category} onChange={(event) => update("category", event.target.value)}><option>Karakter oluşturma</option><option>Level up</option><option>Play Mode</option><option>Spell / özellik</option><option>Envanter</option><option>Yedek / geri yükleme</option><option>Arayüz / erişilebilirlik</option></select></label><label>Önem<select value={feedback.severity} onChange={(event) => update("severity", event.target.value)}><option>Düşük</option><option>Orta</option><option>Yüksek</option><option>Engelleyici</option></select></label><label>Cihaz / tarayıcı<input value={feedback.device} onChange={(event) => update("device", event.target.value)} placeholder="Örn. Windows 11 · Chrome" /></label><label className="wide">Tekrarlama adımları<textarea value={feedback.steps} onChange={(event) => update("steps", event.target.value)} rows={4} /></label><label className="wide">Beklenen sonuç<textarea value={feedback.expected} onChange={(event) => update("expected", event.target.value)} rows={3} /></label><label className="wide">Gerçek sonuç<textarea value={feedback.actual} onChange={(event) => update("actual", event.target.value)} rows={3} /></label></div><div className="player-test-export"><p><strong>Gizlilik:</strong> Karakter/oyuncu isimleri, karakter notları ve eşya notları dışarı aktarılmaz.</p><button type="button" className="primary-button" onClick={exportReport}>Güvenli tanı raporunu indir</button></div></section>
  </PageShell>;
}
