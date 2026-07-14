import type { CampaignEncounterToolPreferences } from "./campaignTypes";

const TOOL_OPTIONS: Array<{
  key: keyof CampaignEncounterToolPreferences;
  title: string;
  description: string;
}> = [
  {
    key: "difficulty",
    title: "Difficulty",
    description: "XP eÅŸikleri ve encounter zorluÄŸu.",
  },
  {
    key: "loot",
    title: "Loot",
    description: "Otomatik ve manuel encounter Ã¶dÃ¼lleri.",
  },
  {
    key: "conditions",
    title: "Conditions",
    description: "Participant bazlÄ± sÃ¼reli durum takibi.",
  },
  {
    key: "combatRolls",
    title: "Combat Rolls",
    description: "Karakter ve monster hÄ±zlÄ± zar araÃ§larÄ±.",
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
          <h3>Encounter ModÃ¼lleri</h3>
          <p>
            Temel initiative ve HP takibi her zaman aÃ§Ä±k. Geri kalan sistemleri
            yalnÄ±zca masada iÅŸine yarÄ±yorsa kullan.
          </p>
        </div>

        <div className="encounter-tool-settings-actions">
          <span>{activeCount}/4 aÃ§Ä±k</span>
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
            TÃ¼mÃ¼nÃ¼ AÃ§
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
            <span>{value[tool.key] ? "AÃ§Ä±k" : "KapalÄ±"}</span>
            <strong>{tool.title}</strong>
            <small>{tool.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

