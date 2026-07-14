import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { navItems } from "../../shared/navigation/navItems";

export type GlobalSearchCategory =
  | "Sayfa"
  | "Karakter"
  | "Campaign"
  | "Büyü"
  | "Eşya"
  | "Canavar"
  | "Yardım";

export type GlobalSearchEntry = {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  to: string;
  icon: string;
  isHomebrew?: boolean;
};

export type BuildGlobalSearchEntriesInput = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  homebrewSpellIds: ReadonlySet<string>;
  homebrewItemIds: ReadonlySet<string>;
  homebrewMonsterIds: ReadonlySet<string>;
};

const HELP_ENTRIES: readonly GlobalSearchEntry[] = [
  {
    id: "help-first-character",
    category: "Yardım",
    title: "İlk karakterini oluştur",
    subtitle: "Başlangıç rehberi",
    description: "Builder ile karakter oluşturma, kaydetme ve detay ekranını tamamlama adımları.",
    keywords: "karakter builder oluştur class race ability başlangıç",
    to: "/help?search=ilk%20karakter",
    icon: "?",
  },
  {
    id: "help-play-mode",
    category: "Yardım",
    title: "Play Mode kullanımı",
    subtitle: "Oyuncu rehberi",
    description: "HP, condition, concentration, spell slot ve hızlı zar yönetimi.",
    keywords: "play mode hp condition concentration spell slot combat",
    to: "/help?search=play%20mode",
    icon: "?",
  },
  {
    id: "help-encounter",
    category: "Yardım",
    title: "Encounter araçları",
    subtitle: "DM rehberi",
    description: "Initiative, difficulty, loot, condition ve combat roll araçlarını yönetme.",
    keywords: "encounter initiative difficulty loot condition combat rolls dm",
    to: "/help?search=encounter",
    icon: "?",
  },
  {
    id: "help-backup",
    category: "Yardım",
    title: "Yedek ve geri yükleme",
    subtitle: "Veri güvenliği rehberi",
    description: "Tam yedek alma, seçmeli içe aktarma ve güvenli veri kurtarma.",
    keywords: "backup yedek import export restore kurtarma json veri",
    to: "/help?search=yedek",
    icon: "?",
  },
  {
    id: "help-pwa",
    category: "Yardım",
    title: "PWA kurulumu ve çevrimdışı kullanım",
    subtitle: "Kurulum rehberi",
    description: "Windows, Android ve iOS cihazlarda uygulamayı kurma ve güncelleme.",
    keywords: "pwa install yükle windows android iphone ios offline çevrimdışı",
    to: "/help?search=pwa",
    icon: "?",
  },
];

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function buildGlobalSearchEntries({
  characters,
  campaigns,
  rulesetData,
  homebrewSpellIds,
  homebrewItemIds,
  homebrewMonsterIds,
}: BuildGlobalSearchEntriesInput): GlobalSearchEntry[] {
  const pages: GlobalSearchEntry[] = navItems.map((item) => ({
    id: `page-${item.to}`,
    category: "Sayfa",
    title: item.label,
    subtitle: `${item.group} bölümü`,
    description: `${item.label} sayfasına git.`,
    keywords: `${item.label} ${item.shortLabel} ${item.group}`,
    to: item.to,
    icon: item.icon,
  }));

  const characterEntries: GlobalSearchEntry[] = characters.map((character) => ({
    id: `character-${character.id}`,
    category: "Karakter",
    title: character.name,
    subtitle: `${character.className || "Sınıfsız"} · Seviye ${character.level}`,
    description: `${character.race || "Irksız"}${character.subclass ? ` · ${character.subclass}` : ""}${character.playerName ? ` · Oyuncu: ${character.playerName}` : ""}`,
    keywords: [
      character.name,
      character.playerName,
      character.className,
      character.subclass,
      character.race,
      character.background,
      character.notes,
      character.conditions.join(" "),
    ].join(" "),
    to: `/characters/${character.id}`,
    icon: "◈",
  }));

  const campaignEntries: GlobalSearchEntry[] = campaigns.map((campaign) => ({
    id: `campaign-${campaign.id}`,
    category: "Campaign",
    title: campaign.name,
    subtitle: `${campaign.characterIds.length} karakter · ${campaign.quests.filter((quest) => quest.status === "active").length} aktif quest`,
    description: campaign.description || "Campaign açıklaması bulunmuyor.",
    keywords: [
      campaign.name,
      campaign.description,
      ...campaign.sessionNotes.flatMap((note) => [note.title, note.body]),
      ...campaign.npcNotes.flatMap((npc) => [npc.name, npc.role, npc.notes]),
      ...campaign.quests.flatMap((quest) => [quest.title, quest.status, quest.notes]),
      ...campaign.encounters.flatMap((encounter) => [
        encounter.name,
        ...encounter.participants.flatMap((participant) => [participant.name, participant.notes]),
      ]),
      ...campaign.timelineEntries.flatMap((entry) => [
        entry.title,
        entry.summary,
        entry.notes,
        ...entry.events,
        ...entry.npcs,
        ...entry.questUpdates,
        ...entry.loot,
        ...entry.casualties,
      ]),
    ].join(" "),
    to: `/campaigns?campaign=${campaign.id}`,
    icon: "✦",
  }));

  const spells: GlobalSearchEntry[] = (rulesetData?.spells ?? []).map((spell) => ({
    id: `spell-${spell.id}`,
    category: "Büyü",
    title: spell.name,
    subtitle: `${spell.level === 0 ? "Cantrip" : `${spell.level}. seviye`} · ${spell.school}`,
    description: spell.description,
    keywords: [
      spell.name,
      spell.school,
      spell.castingTime,
      spell.range,
      spell.duration,
      spell.classes.join(" "),
      spell.description,
      spell.higherLevels ?? "",
      spell.damageType ?? "",
      spell.conditionEffect ?? "",
    ].join(" "),
    to: `/spellbook?search=${encodeURIComponent(spell.name)}`,
    icon: "✧",
    isHomebrew: homebrewSpellIds.has(spell.id),
  }));

  const items: GlobalSearchEntry[] = (rulesetData?.items ?? []).map((item) => ({
    id: `item-${item.id}`,
    category: "Eşya",
    title: item.name,
    subtitle: `${item.category} · ${item.cost || "Fiyat yok"}`,
    description: item.description,
    keywords: [
      item.name,
      item.category,
      item.description,
      item.damage ?? "",
      item.damageType ?? "",
      item.armorType ?? "",
      ...(item.properties ?? []),
      ...(item.tags ?? []),
    ].join(" "),
    to: `/inventory?search=${encodeURIComponent(item.name)}`,
    icon: "▣",
    isHomebrew: homebrewItemIds.has(item.id),
  }));

  const monsters: GlobalSearchEntry[] = (rulesetData?.monsters ?? []).map((monster) => ({
    id: `monster-${monster.id}`,
    category: "Canavar",
    title: monster.name,
    subtitle: `CR ${monster.challengeRating} · ${monster.type}`,
    description: monster.description || `${monster.size} ${monster.type}, AC ${monster.armorClass}, HP ${monster.hitPoints}`,
    keywords: [
      monster.name,
      monster.type,
      monster.size,
      monster.alignment,
      monster.challengeRating,
      monster.senses,
      monster.languages,
      monster.description,
      ...monster.traits,
      ...monster.actions,
    ].join(" "),
    to: `/monsters/${monster.id}`,
    icon: "♜",
    isHomebrew: homebrewMonsterIds.has(monster.id),
  }));

  return [
    ...pages,
    ...characterEntries,
    ...campaignEntries,
    ...spells,
    ...items,
    ...monsters,
    ...HELP_ENTRIES,
  ];
}

export function searchGlobalEntries(
  entries: readonly GlobalSearchEntry[],
  query: string,
  category: GlobalSearchCategory | "Tümü" = "Tümü",
) {
  const normalizedQuery = normalizeSearchText(query.trim());
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  return entries
    .filter((entry) => category === "Tümü" || entry.category === category)
    .map((entry) => {
      if (!normalizedQuery) return { entry, score: 1 };

      const title = normalizeSearchText(entry.title);
      const subtitle = normalizeSearchText(entry.subtitle);
      const haystack = normalizeSearchText(
        `${entry.title} ${entry.subtitle} ${entry.description} ${entry.keywords} ${entry.category}`,
      );

      let score = 0;
      if (title === normalizedQuery) score += 120;
      if (title.startsWith(normalizedQuery)) score += 75;
      if (title.includes(normalizedQuery)) score += 50;
      if (subtitle.includes(normalizedQuery)) score += 25;
      if (haystack.includes(normalizedQuery)) score += 20;
      score += words.filter((word) => title.includes(word)).length * 18;
      score += words.filter((word) => haystack.includes(word)).length * 7;

      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.entry.title.localeCompare(second.entry.title, "tr"),
    )
    .map(({ entry }) => entry);
}
