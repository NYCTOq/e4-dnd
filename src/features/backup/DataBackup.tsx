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
  { key: "characters", label: "Karakterler", description: "Statlar, bÃ¼yÃ¼ler ve envanter." },
  { key: "campaigns", label: "Campaign'ler", description: "Encounter, quest, timeline ve loot." },
  { key: "homebrewSpells", label: "Homebrew bÃ¼yÃ¼ler", description: "Custom spell kayÄ±tlarÄ±." },
  { key: "homebrewItems", label: "Homebrew eÅŸyalar", description: "Custom item kayÄ±tlarÄ±." },
  { key: "homebrewMonsters", label: "Homebrew canavarlar", description: "Custom monster ve NPC kayÄ±tlarÄ±." },
  { key: "favoriteMonsterIds", label: "Favori canavarlar", description: "Monster Library favorileri." },
  { key: "appSettings", label: "Uygulama ayarlarÄ±", description: "GÃ¶rÃ¼nÃ¼m ve varsayÄ±lan tercihler." },
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
          : "Tam yedek okunamadÄ±. JSON goblinleri yine iÅŸ baÅŸÄ±nda.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function applyPendingBackup() {
    if (!pendingBackup) return;
    const selectedCount = Object.values(importSections).filter(Boolean).length;
    if (selectedCount === 0) {
      alert("En az bir veri tÃ¼rÃ¼ seÃ§melisin.");
      return;
    }

    const verb = importMode === "merge" ? "mevcut verilerle birleÅŸtirilecek" : "seÃ§ilen mevcut verilerin Ã¼zerine yazÄ±lacak";
    if (!confirm(`SeÃ§ilen yedek verileri ${verb}. Devam edilsin mi?`)) return;

    onImportFullBackup(pendingBackup.backup.data, {
      mode: importMode,
      sections: importSections,
    });
    setPendingBackup(null);
    alert(importMode === "merge" ? "Yedek verileri birleÅŸtirildi." : "SeÃ§ilen veriler geri yÃ¼klendi.");
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
      alert("Yedeklenecek karakter yok kankam. BoÅŸluÄŸu JSON'a Ã§eviremiyoruz.");
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
        alert("Bu dosya karakter listesi deÄŸil.");
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
        alert("Bu JSON bizim karakter formatÄ±mÄ±za benzemiyor.");
        return;
      }

      if (!confirm(`${parsed.length} karakter mevcut listenin Ã¼stÃ¼ne yazÄ±lacak. Devam edilsin mi?`)) {
        return;
      }

      onImportCharacters(parsed as Character[]);
    } catch {
      alert("JSON okunamadÄ±. Dosya bozuk olabilir.");
    } finally {
      event.target.value = "";
    }
  }

  function handleWipeCharacters() {
    if (characters.length === 0) {
      alert("Zaten silinecek karakter yok.");
      return;
    }
    if (confirm("TÃ¼m karakterler silinsin mi? Bu iÅŸlem geri alÄ±namaz.")) {
      onWipeCharacters();
    }
  }

  function handleWipeAll() {
    const text = prompt(
      'TÃ¼m karakter, campaign ve homebrew verileri silinecek. Onaylamak iÃ§in "SIL" yaz.',
    );
    if (text?.trim().toUpperCase() === "SIL") {
      onWipeAllData();
      alert("TÃ¼m yerel veriler temizlendi.");
    }
  }

  return (
    <PageShell
      eyebrow="Data Backup"
      title="Yedek"
      description="YedeÄŸi Ã¶nce incele, veri tÃ¼rlerini seÃ§ ve birleÅŸtirme biÃ§imine karar ver. KÃ¶rlemesine geri yÃ¼kleme dÃ¶nemi, insanlÄ±k adÄ±na kÃ¼Ã§Ã¼k de olsa sona erdi."
    >
      <div className="backup-layout">
        <section className="backup-card backup-primary backup-wide">
          <span className="mini-label">Full Backup V2</span>
          <h2>TÃ¼m E4 D&D verisini yedekle</h2>
          <p>
            Karakterler, campaign kayÄ±tlarÄ±, encounter ve timeline verileri,
            homebrew iÃ§erikler, favori canavarlar ve uygulama tercihleri tek JSON dosyasÄ±na alÄ±nÄ±r.
          </p>

          <div className="backup-overview-grid">
            <div><strong>{characters.length}</strong><span>Karakter</span></div>
            <div><strong>{campaigns.length}</strong><span>Campaign</span></div>
            <div><strong>{totalHomebrew}</strong><span>Homebrew</span></div>
            <div><strong>{loadFavoriteMonsterIds().length}</strong><span>Favori</span></div>
          </div>

          <div className="backup-actions">
            <button className="primary-action" onClick={handleFullExport}>
              Tam Yedek Ä°ndir
            </button>
            <label className="backup-file-button">
              Yedek DosyasÄ± SeÃ§
              <input type="file" accept="application/json,.json" onChange={handleFullImportFile} />
            </label>
          </div>
        </section>

        {pendingBackup && preview && (
          <section className="backup-card backup-wide backup-import-preview" aria-labelledby="backup-preview-title">
            <div className="backup-preview-head">
              <div>
                <span className="mini-label">Import Preview</span>
                <h2 id="backup-preview-title">YedeÄŸi incele</h2>
                <p>{pendingBackup.fileName} Â· V{pendingBackup.backup.version} Â· {new Date(pendingBackup.backup.exportedAt).toLocaleString("tr-TR")}</p>
              </div>
              <button onClick={() => setPendingBackup(null)}>Ä°ptal</button>
            </div>

            <div className="backup-mode-grid" role="radiogroup" aria-label="Ä°Ã§e aktarma biÃ§imi">
              <button
                className={importMode === "merge" ? "active" : ""}
                onClick={() => setImportMode("merge")}
                role="radio"
                aria-checked={importMode === "merge"}
              >
                <strong>BirleÅŸtir</strong>
                <span>AynÄ± ID varsa yedekteki gÃ¼ncel kayÄ±t kullanÄ±lÄ±r; diÄŸerleri korunur.</span>
              </button>
              <button
                className={importMode === "replace" ? "active" : ""}
                onClick={() => setImportMode("replace")}
                role="radio"
                aria-checked={importMode === "replace"}
              >
                <strong>Ãœzerine yaz</strong>
                <span>YalnÄ±zca seÃ§ilen veri tÃ¼rleri tamamen yedekteki hÃ¢liyle deÄŸiÅŸtirilir.</span>
              </button>
            </div>

            <div className="backup-selection-head">
              <div>
                <h3>Geri yÃ¼klenecek veriler</h3>
                <p>Ä°stemediÄŸin bÃ¶lÃ¼mleri kapat. Uygulama bu kez fikrini okumaya Ã§alÄ±ÅŸmayacak.</p>
              </div>
              <div className="backup-selection-actions">
                <button onClick={() => selectAllSections(true)}>TÃ¼mÃ¼nÃ¼ seÃ§</button>
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
                  ? "BirleÅŸtirme sÄ±rasÄ±nda aynÄ± ID'li kayÄ±tlar yedek sÃ¼rÃ¼mÃ¼yle gÃ¼ncellenir."
                  : "Ãœzerine yazma yalnÄ±zca seÃ§tiÄŸin veri tÃ¼rlerini deÄŸiÅŸtirir; kapalÄ± bÃ¶lÃ¼mler korunur."}
              </p>
              <button className="primary-action" onClick={applyPendingBackup}>
                SeÃ§ilen Verileri Geri YÃ¼kle
              </button>
            </div>
          </section>
        )}

        <section className="backup-card">
          <span className="mini-label">Legacy Character Backup</span>
          <h2>YalnÄ±zca karakterler</h2>
          <p>Eski karakter-only JSON formatÄ± Ã§alÄ±ÅŸmaya devam eder.</p>
          <div className="backup-actions">
            <button onClick={handleCharacterExport}>Karakter JSON Ä°ndir</button>
            <label className="backup-file-button">
              Karakter JSON Ä°Ã§e Aktar
              <input type="file" accept="application/json,.json" onChange={handleCharacterImport} />
            </label>
          </div>
        </section>

        <section className="backup-card">
          <span className="mini-label">Danger Zone</span>
          <h2>Yerel veriyi temizle</h2>
          <p>Ã–nce tam yedek almak, sonradan dramatik bakÄ±ÅŸlarla ekrana bakmaktan daha etkilidir.</p>
          <div className="backup-danger-actions">
            <button className="danger-action" onClick={handleWipeCharacters}>
              YalnÄ±zca Karakterleri Sil
            </button>
            <button className="danger-action danger-action-strong" onClick={handleWipeAll}>
              TÃ¼m Uygulama Verisini Sil
            </button>
          </div>
        </section>

        <section className="backup-card backup-wide">
          <span className="mini-label">Backup Contents</span>
          <h2>Tek dosyada neler var?</h2>
          <div className="backup-format-grid">
            <div><strong>Characters</strong><span>Statlar, bÃ¼yÃ¼ler, inventory ve level bilgileri.</span></div>
            <div><strong>Campaigns</strong><span>Encounter, timeline, quest, NPC ve session kayÄ±tlarÄ±.</span></div>
            <div><strong>Homebrew</strong><span>Custom spell, item ve monster iÃ§erikleri.</span></div>
            <div><strong>Ayarlar</strong><span>GÃ¶rÃ¼nÃ¼m, aÃ§Ä±lÄ±ÅŸ ekranÄ± ve DM varsayÄ±lanlarÄ±.</span></div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

