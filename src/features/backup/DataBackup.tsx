import { useMemo, useState } from "react";
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
  DEFAULT_BACKUP_IMPORT_SECTIONS,
  exportFullBackup,
  parseFullBackup,
  type BackupImportMode,
  type BackupImportOptions,
  type BackupImportSections,
  type E4FullBackup,
  type FullBackupData,
} from "./fullBackup";

type DataBackupProps = {
  characters: Character[];
  campaigns: Campaign[];
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
  onImportCharacters: (characters: Character[]) => void;
  onImportFullBackup: (data: FullBackupData, options: BackupImportOptions) => void;
  onWipeCharacters: () => void;
  onWipeAllData: () => void;
};

type PendingBackup = {
  fileName: string;
  backup: E4FullBackup;
};

const SECTION_LABELS: Array<{
  key: keyof BackupImportSections;
  label: string;
  description: string;
}> = [
  { key: "characters", label: "Karakterler", description: "Statlar, büyüler ve envanter." },
  { key: "campaigns", label: "Campaign'ler", description: "Encounter, quest, timeline ve loot." },
  { key: "homebrewSpells", label: "Homebrew büyüler", description: "Custom spell kayıtları." },
  { key: "homebrewItems", label: "Homebrew eşyalar", description: "Custom item kayıtları." },
  { key: "homebrewMonsters", label: "Homebrew canavarlar", description: "Custom monster ve NPC kayıtları." },
  { key: "favoriteMonsterIds", label: "Favori canavarlar", description: "Monster Library favorileri." },
  { key: "appSettings", label: "Uygulama ayarları", description: "Görünüm ve varsayılan tercihler." },
];

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
  const [pendingBackup, setPendingBackup] = useState<PendingBackup | null>(null);
  const [importMode, setImportMode] = useState<BackupImportMode>("merge");
  const [importSections, setImportSections] = useState<BackupImportSections>(
    DEFAULT_BACKUP_IMPORT_SECTIONS,
  );
  const totalHomebrew =
    homebrewSpells.length + homebrewItems.length + homebrewMonsters.length;

  const preview = useMemo(() => {
    if (!pendingBackup) return null;
    const data = pendingBackup.backup.data;
    const currentFavoriteIds = loadFavoriteMonsterIds();
    return {
      characters: { incoming: data.characters.length, existing: characters.length },
      campaigns: { incoming: data.campaigns.length, existing: campaigns.length },
      homebrewSpells: { incoming: data.homebrewSpells.length, existing: homebrewSpells.length },
      homebrewItems: { incoming: data.homebrewItems.length, existing: homebrewItems.length },
      homebrewMonsters: { incoming: data.homebrewMonsters.length, existing: homebrewMonsters.length },
      favoriteMonsterIds: { incoming: data.favoriteMonsterIds.length, existing: currentFavoriteIds.length },
    };
  }, [pendingBackup, characters.length, campaigns.length, homebrewSpells.length, homebrewItems.length, homebrewMonsters.length]);

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

  async function handleFullImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = parseFullBackup(JSON.parse(await file.text()));
      setPendingBackup({ fileName: file.name, backup });
      setImportMode("merge");
      setImportSections({ ...DEFAULT_BACKUP_IMPORT_SECTIONS });
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

  function applyPendingBackup() {
    if (!pendingBackup) return;
    const selectedCount = Object.values(importSections).filter(Boolean).length;
    if (selectedCount === 0) {
      alert("En az bir veri türü seçmelisin.");
      return;
    }

    const verb = importMode === "merge" ? "mevcut verilerle birleştirilecek" : "seçilen mevcut verilerin üzerine yazılacak";
    if (!confirm(`Seçilen yedek verileri ${verb}. Devam edilsin mi?`)) return;

    onImportFullBackup(pendingBackup.backup.data, {
      mode: importMode,
      sections: importSections,
    });
    setPendingBackup(null);
    alert(importMode === "merge" ? "Yedek verileri birleştirildi." : "Seçilen veriler geri yüklendi.");
  }

  function toggleSection(key: keyof BackupImportSections) {
    setImportSections((current) => ({ ...current, [key]: !current[key] }));
  }

  function selectAllSections(value: boolean) {
    setImportSections(
      Object.fromEntries(
        Object.keys(DEFAULT_BACKUP_IMPORT_SECTIONS).map((key) => [key, value]),
      ) as BackupImportSections,
    );
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

      if (!confirm(`${parsed.length} karakter mevcut listenin üstüne yazılacak. Devam edilsin mi?`)) {
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
      description="Yedeği önce incele, veri türlerini seç ve birleştirme biçimine karar ver. Körlemesine geri yükleme dönemi, insanlık adına küçük de olsa sona erdi."
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
              Yedek Dosyası Seç
              <input type="file" accept="application/json,.json" onChange={handleFullImportFile} />
            </label>
          </div>
        </section>

        {pendingBackup && preview && (
          <section className="backup-card backup-wide backup-import-preview" aria-labelledby="backup-preview-title">
            <div className="backup-preview-head">
              <div>
                <span className="mini-label">Import Preview</span>
                <h2 id="backup-preview-title">Yedeği incele</h2>
                <p>{pendingBackup.fileName} · V{pendingBackup.backup.version} · {new Date(pendingBackup.backup.exportedAt).toLocaleString("tr-TR")}</p>
              </div>
              <button onClick={() => setPendingBackup(null)}>İptal</button>
            </div>

            <div className="backup-mode-grid" role="radiogroup" aria-label="İçe aktarma biçimi">
              <button
                className={importMode === "merge" ? "active" : ""}
                onClick={() => setImportMode("merge")}
                role="radio"
                aria-checked={importMode === "merge"}
              >
                <strong>Birleştir</strong>
                <span>Aynı ID varsa yedekteki güncel kayıt kullanılır; diğerleri korunur.</span>
              </button>
              <button
                className={importMode === "replace" ? "active" : ""}
                onClick={() => setImportMode("replace")}
                role="radio"
                aria-checked={importMode === "replace"}
              >
                <strong>Üzerine yaz</strong>
                <span>Yalnızca seçilen veri türleri tamamen yedekteki hâliyle değiştirilir.</span>
              </button>
            </div>

            <div className="backup-selection-head">
              <div>
                <h3>Geri yüklenecek veriler</h3>
                <p>İstemediğin bölümleri kapat. Uygulama bu kez fikrini okumaya çalışmayacak.</p>
              </div>
              <div className="backup-selection-actions">
                <button onClick={() => selectAllSections(true)}>Tümünü seç</button>
                <button onClick={() => selectAllSections(false)}>Temizle</button>
              </div>
            </div>

            <div className="backup-section-grid">
              {SECTION_LABELS.map((section) => {
                const counts = section.key === "appSettings" ? null : preview[section.key];
                return (
                  <label key={section.key} className={importSections[section.key] ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={importSections[section.key]}
                      onChange={() => toggleSection(section.key)}
                    />
                    <span>
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </span>
                    {counts ? <b>{counts.incoming} yedek / {counts.existing} mevcut</b> : <b>Tercihler</b>}
                  </label>
                );
              })}
            </div>

            <div className="backup-import-footer">
              <p>
                {importMode === "merge"
                  ? "Birleştirme sırasında aynı ID'li kayıtlar yedek sürümüyle güncellenir."
                  : "Üzerine yazma yalnızca seçtiğin veri türlerini değiştirir; kapalı bölümler korunur."}
              </p>
              <button className="primary-action" onClick={applyPendingBackup}>
                Seçilen Verileri Geri Yükle
              </button>
            </div>
          </section>
        )}

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
