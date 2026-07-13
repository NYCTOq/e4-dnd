import type { CampaignEncounterToolPreferences } from "./campaignTypes";

const TOOL_OPTIONS: Array<{
  key: keyof CampaignEncounterToolPreferences;
  title: string;
  description: string;
}> = [
  {
    key: "difficulty",
    title: "Difficulty",
    description: "XP eşikleri ve encounter zorluğu.",
  },
  {
    key: "loot",
    title: "Loot",
    description: "Otomatik ve manuel encounter ödülleri.",
  },
  {
    key: "conditions",
    title: "Conditions",
    description: "Participant bazlı süreli durum takibi.",
  },
  {
    key: "combatRolls",
    title: "Combat Rolls",
    description: "Karakter ve monster hızlı zar araçları.",
  },
];

export function EncounterToolSettings({
  value,
  onChange,
}: {
  value: CampaignEncounterToolPreferences;
  onChange: (value: CampaignEncounterToolPreferences) => void;
}) {
  const activeCount = TOOL_OPTIONS.filter(({ key }) => value[key]).length;

  function toggle(key: keyof CampaignEncounterToolPreferences) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <section className="encounter-tool-settings">
      <div className="encounter-tool-settings-head">
        <div>
          <span className="mini-label">Optional DM Tools</span>
          <h3>Encounter Modülleri</h3>
          <p>
            Temel initiative ve HP takibi her zaman açık. Geri kalan sistemleri
            yalnızca masada işine yarıyorsa kullan.
          </p>
        </div>

        <div className="encounter-tool-settings-actions">
          <span>{activeCount}/4 açık</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                difficulty: false,
                loot: false,
                conditions: false,
                combatRolls: false,
              })
            }
          >
            Sade Mod
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                difficulty: true,
                loot: true,
                conditions: true,
                combatRolls: true,
              })
            }
          >
            Tümünü Aç
          </button>
        </div>
      </div>

      <div className="encounter-tool-toggle-grid">
        {TOOL_OPTIONS.map((tool) => (
          <button
            className={value[tool.key] ? "active" : ""}
            key={tool.key}
            type="button"
            aria-pressed={value[tool.key]}
            onClick={() => toggle(tool.key)}
          >
            <span>{value[tool.key] ? "Açık" : "Kapalı"}</span>
            <strong>{tool.title}</strong>
            <small>{tool.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
