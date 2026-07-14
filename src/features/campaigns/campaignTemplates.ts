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
    name: "Sade Başlangıç",
    eyebrow: "Minimal",
    description:
      "Yalnızca temel party, not, NPC ve quest alanları. Ekstra DM araçları uygulama ayarındaki varsayılan profili kullanır.",
    timelineEnabled: false,
    encounterTools: null,
    highlights: ["Hızlı kurulum", "Temel takip", "Ayar profilini kullanır"],
  },
  {
    id: "classic",
    name: "Klasik Macera",
    eyebrow: "Dengeli",
    description:
      "Quest, session timeline ve temel encounter desteği birlikte gelir. Çoğu masa için makul orta yol.",
    timelineEnabled: true,
    encounterTools: {
      difficulty: true,
      loot: false,
      conditions: true,
      combatRolls: false,
    },
    highlights: ["Timeline açık", "Difficulty açık", "Condition takibi"],
  },
  {
    id: "story",
    name: "Story-Heavy",
    eyebrow: "Anlatı",
    description:
      "Session timeline ve hikâye kayıtları önde; encounter araçları kapalı. Karakter dramı zaten yeterince karmaşık.",
    timelineEnabled: true,
    encounterTools: {
      difficulty: false,
      loot: false,
      conditions: false,
      combatRolls: false,
    },
    highlights: ["Timeline açık", "Sade encounter", "Not odaklı"],
  },
  {
    id: "combat",
    name: "Encounter-Heavy",
    eyebrow: "Taktik",
    description:
      "Difficulty, loot, condition ve combat roll araçlarının tamamı açık gelir. DM kokpiti isteyenler için.",
    timelineEnabled: false,
    encounterTools: {
      difficulty: true,
      loot: true,
      conditions: true,
      combatRolls: true,
    },
    highlights: ["Tüm DM araçları", "Loot açık", "Combat roll açık"],
  },
];

export function getCampaignTemplate(id: CampaignTemplateId) {
  return (
    CAMPAIGN_TEMPLATES.find((template) => template.id === id) ??
    CAMPAIGN_TEMPLATES[0]
  );
}
