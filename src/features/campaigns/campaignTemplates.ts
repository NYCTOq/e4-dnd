import type { CampaignEncounterToolPreferences } from "./campaignTypes";

export type CampaignTemplateId =
  | "simple"
  | "classic"
  | "story"
  | "combat";

export type CampaignTemplate = {
  id: CampaignTemplateId;
  name: string;
  eyebrow: string;
  description: string;
  timelineEnabled: boolean;
  encounterTools: CampaignEncounterToolPreferences | null;
  highlights: string[];
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "simple",
    name: "Sade BaÅŸlangÄ±Ã§",
    eyebrow: "Minimal",
    description:
      "YalnÄ±zca temel party, not, NPC ve quest alanlarÄ±. Ekstra DM araÃ§larÄ± uygulama ayarÄ±ndaki varsayÄ±lan profili kullanÄ±r.",
    timelineEnabled: false,
    encounterTools: null,
    highlights: ["HÄ±zlÄ± kurulum", "Temel takip", "Ayar profilini kullanÄ±r"],
  },
  {
    id: "classic",
    name: "Klasik Macera",
    eyebrow: "Dengeli",
    description:
      "Quest, session timeline ve temel encounter desteÄŸi birlikte gelir. Ã‡oÄŸu masa iÃ§in makul orta yol.",
    timelineEnabled: true,
    encounterTools: {
      difficulty: true,
      loot: false,
      conditions: true,
      combatRolls: false,
    },
    highlights: ["Timeline aÃ§Ä±k", "Difficulty aÃ§Ä±k", "Condition takibi"],
  },
  {
    id: "story",
    name: "Story-Heavy",
    eyebrow: "AnlatÄ±",
    description:
      "Session timeline ve hikÃ¢ye kayÄ±tlarÄ± Ã¶nde; encounter araÃ§larÄ± kapalÄ±. Karakter dramÄ± zaten yeterince karmaÅŸÄ±k.",
    timelineEnabled: true,
    encounterTools: {
      difficulty: false,
      loot: false,
      conditions: false,
      combatRolls: false,
    },
    highlights: ["Timeline aÃ§Ä±k", "Sade encounter", "Not odaklÄ±"],
  },
  {
    id: "combat",
    name: "Encounter-Heavy",
    eyebrow: "Taktik",
    description:
      "Difficulty, loot, condition ve combat roll araÃ§larÄ±nÄ±n tamamÄ± aÃ§Ä±k gelir. DM kokpiti isteyenler iÃ§in.",
    timelineEnabled: false,
    encounterTools: {
      difficulty: true,
      loot: true,
      conditions: true,
      combatRolls: true,
    },
    highlights: ["TÃ¼m DM araÃ§larÄ±", "Loot aÃ§Ä±k", "Combat roll aÃ§Ä±k"],
  },
];

export function getCampaignTemplate(id: CampaignTemplateId) {
  return (
    CAMPAIGN_TEMPLATES.find((template) => template.id === id) ??
    CAMPAIGN_TEMPLATES[0]
  );
}

