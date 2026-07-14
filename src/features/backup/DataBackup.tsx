import type { Character } from "../../core/character/character.types";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";
import { exportCharacters } from "../../core/storage/characterStorage";
import { PageShell } from "../../shared/layout/PageShell";
import type { Campaign } from "../campaigns/campaignTypes";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import { loadFavoriteMonsterIds } from "../monsters/monsterUtils";
import {
  exportFullBackup,
  parseFullBackup,
  type FullBackupData,
} from "./fullBackup";

type DataBackupProps = {
  characters: Character[];
  campaigns: Campaign[];
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
  onImportCharacters: (characters: Character[]) => void;
  onImportFullBackup: (data: FullBackupData) => void;
  onWipeCharacters: () => void;
  onWipeAllData: () => void;
};

export function DataBackup({
  characters,
  campaigns,
  homebrewSpells,
  homebrewItems,
  homebrewMonsters,
  onImportCharacters,
  onImportFullBackup,
  onWipeCharacters,
  onWipeAllData,
}: DataBackupProps) {
  const { settings } = useAppSettings();
  const totalHomebrew =
    homebrewSpells.length + homebrewItems.length + homebrewMonsters.length;

  function handleFullExport() {
    exportFullBackup({
      characters,
      campaigns,
      homebrewSpells,
      homebrewItems,
      homebrewMonsters,
      favoriteMonsterIds: loadFavoriteMonsterIds(),
      appSettings: settings,
    });
  }

  async function handleFullImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = parseFullBackup(JSON.parse(await file.text()));
      const confirmed = confirm(
        "Tam yedek mevcut karakter, campaign ve homebrew verilerinin üzerine yazacak. Devam edilsin mi?",
      );

      if (!confirmed) return;
      onImportFullBackup(parsed.data);
      alert("Tam yedek geri yüklendi. Dijital evren şimdilik kurtarıldı.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Tam yedek okunamadı. JSON goblinleri yine iş başında.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleCharacterExport() {
    if (characters.length === 0) {
      alert("Yedeklenecek karakter yok kankam. Boşluğu JSON'a çeviremiyoruz.");
      return;
    }
    exportCharacters(characters);
  }

  async function handleCharacterImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) {
        alert("Bu dosya karakter listesi değil.");
        return;
      }

      const looksValid = parsed.every(
        (item) =>
          typeof item?.id === "string" &&
          typeof item?.name === "string" &&
          typeof item?.className === "string" &&
          typeof item?.level === "number" &&
          typeof item?.maxHp === "number" &&
          typeof item?.armorClass === "number" &&
          typeof item?.abilities === "object",
      );

      if (!looksValid) {
        alert("Bu JSON bizim karakter formatımıza benzemiyor.");
        return;
      }

      if (!confirm("Bu işlem mevcut karakter listesinin üstüne yazacak. Devam edilsin mi?")) {
        return;
      }

      onImportCharacters(parsed as Character[]);
    } catch {
      alert("JSON okunamadı. Dosya bozuk olabilir.");
    } finally {
      event.target.value = "";
    }
  }

  function handleWipeCharacters() {
    if (characters.length === 0) {
      alert("Zaten silinecek karakter yok.");
      return;
    }
    if (confirm("Tüm karakterler silinsin mi? Bu işlem geri alınamaz.")) {
      onWipeCharacters();
    }
  }

  function handleWipeAll() {
    const text = prompt(
      'Tüm karakter, campaign ve homebrew verileri silinecek. Onaylamak için "SIL" yaz.',
    );
    if (text?.trim().toUpperCase() === "SIL") {
      onWipeAllData();
      alert("Tüm yerel veriler temizlendi.");
    }
  }

  return (
    <PageShell
      eyebrow="Data Backup"
      title="Yedek"
      description="Tüm uygulama verisini tek dosyada taşı veya yalnızca karakter yedeği kullan. Cloud yok, dolayısıyla sorumluluk yine şaşırtıcı biçimde kullanıcıda."
    >
      <div className="backup-layout">
        <section className="backup-card backup-primary backup-wide">
          <span className="mini-label">Full Backup V2</span>
          <h2>Tüm E4 D&D verisini yedekle</h2>
          <p>
            Karakterler, campaign kayıtları, encounter ve timeline verileri,
            homebrew içerikler, favori canavarlar ve uygulama tercihleri tek JSON dosyasına alınır.
          </p>

          <div className="backup-overview-grid">
            <div><strong>{characters.length}</strong><span>Karakter</span></div>
            <div><strong>{campaigns.length}</strong><span>Campaign</span></div>
            <div><strong>{totalHomebrew}</strong><span>Homebrew</span></div>
            <div><strong>{loadFavoriteMonsterIds().length}</strong><span>Favori</span></div>
          </div>

          <div className="backup-actions">
            <button className="primary-action" onClick={handleFullExport}>
              Tam Yedek İndir
            </button>
            <label className="backup-file-button">
              Tam Yedek Geri Yükle
              <input type="file" accept="application/json,.json" onChange={handleFullImport} />
            </label>
          </div>
        </section>

        <section className="backup-card">
          <span className="mini-label">Legacy Character Backup</span>
          <h2>Yalnızca karakterler</h2>
          <p>Eski karakter-only JSON formatı çalışmaya devam eder.</p>
          <div className="backup-actions">
            <button onClick={handleCharacterExport}>Karakter JSON İndir</button>
            <label className="backup-file-button">
              Karakter JSON İçe Aktar
              <input type="file" accept="application/json,.json" onChange={handleCharacterImport} />
            </label>
          </div>
        </section>

        <section className="backup-card">
          <span className="mini-label">Danger Zone</span>
          <h2>Yerel veriyi temizle</h2>
          <p>Önce tam yedek almak, sonradan dramatik bakışlarla ekrana bakmaktan daha etkilidir.</p>
          <div className="backup-danger-actions">
            <button className="danger-action" onClick={handleWipeCharacters}>
              Yalnızca Karakterleri Sil
            </button>
            <button className="danger-action danger-action-strong" onClick={handleWipeAll}>
              Tüm Uygulama Verisini Sil
            </button>
          </div>
        </section>

        <section className="backup-card backup-wide">
          <span className="mini-label">Backup Contents</span>
          <h2>Tek dosyada neler var?</h2>
          <div className="backup-format-grid">
            <div><strong>Characters</strong><span>Statlar, büyüler, inventory ve level bilgileri.</span></div>
            <div><strong>Campaigns</strong><span>Encounter, timeline, quest, NPC ve session kayıtları.</span></div>
            <div><strong>Homebrew</strong><span>Custom spell, item ve monster içerikleri.</span></div>
            <div><strong>Ayarlar</strong><span>Görünüm, açılış ekranı ve DM varsayılanları.</span></div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
