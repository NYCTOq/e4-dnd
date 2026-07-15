import type { AbilityScores, CharacterResource, ResourceRecovery, RulesetId } from "../character/character.types";

export type ClassFeatureAction = {
  id: string; name: string; actionType: "Action" | "Bonus Action" | "Reaction" | "Passive";
  resourceId?: string; summary: string;
};

const resource = (id: string, name: string, max: number, recovery: ResourceRecovery): CharacterResource => ({ id, name, max: Math.max(1, Math.floor(max)), used: 0, recovery });
const modifier = (score: number) => Math.max(1, Math.floor((score - 10) / 2));

export function getClassResources(className: string, level: number, abilities: AbilityScores, ruleset: RulesetId): CharacterResource[] {
  const key = className.trim().toLowerCase();
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level)));
  switch (key) {
    case "barbarian": return [resource("rage", "Rage", safeLevel >= 17 ? 6 : safeLevel >= 12 ? 5 : safeLevel >= 6 ? 4 : safeLevel >= 3 ? 3 : 2, "long")];
    case "bard": return [resource("bardic-inspiration", "Bardic Inspiration", modifier(abilities.cha), safeLevel >= 5 ? "short" : "long")];
    case "cleric": return [resource("channel-divinity", "Channel Divinity", safeLevel >= 18 ? 3 : safeLevel >= 6 ? 2 : 1, "short")];
    case "druid": return [resource("wild-shape", "Wild Shape", 2, "short")];
    case "fighter": return [
      resource("second-wind", "Second Wind", ruleset === "dnd_2024" ? (safeLevel >= 10 ? 4 : safeLevel >= 4 ? 3 : 2) : 1, "short"),
      ...(safeLevel >= 2 ? [resource("action-surge", "Action Surge", safeLevel >= 17 ? 2 : 1, "short")] : []),
      ...(safeLevel >= 9 ? [resource("indomitable", "Indomitable", safeLevel >= 17 ? 3 : safeLevel >= 13 ? 2 : 1, "long")] : []),
    ];
    case "monk": return safeLevel >= 2 ? [resource("focus-points", ruleset === "dnd_2024" ? "Focus Points" : "Ki Points", safeLevel, "short")] : [];
    case "paladin": return [resource("lay-on-hands", "Lay on Hands", safeLevel * 5, "long"), ...(safeLevel >= 3 ? [resource("channel-divinity", "Channel Divinity", 1, "short")] : [])];
    case "ranger": return ruleset === "dnd_2024" ? [resource("favored-enemy", "Favored Enemy", modifier(abilities.wis), "long")] : [];
    case "rogue": return safeLevel >= 20 ? [resource("stroke-of-luck", "Stroke of Luck", 1, "short")] : [];
    case "sorcerer": return safeLevel >= 2 ? [resource("sorcery-points", "Sorcery Points", safeLevel, "long")] : [];
    case "warlock": return safeLevel >= 11 ? [resource("mystic-arcanum", "Mystic Arcanum", Math.min(4, safeLevel - 10), "long")] : [];
    case "wizard": return [resource("arcane-recovery", "Arcane Recovery", 1, "long")];
    default: return [];
  }
}

export function mergeClassResources(current: CharacterResource[] | undefined, generated: CharacterResource[]) {
  const currentMap = new Map((current ?? []).map((item) => [item.id, item]));
  const generatedIds = new Set(generated.map((item) => item.id));
  return [
    ...generated.map((item) => ({ ...item, used: Math.min(item.max, Math.max(0, currentMap.get(item.id)?.used ?? 0)) })),
    ...(current ?? []).filter((item) => !generatedIds.has(item.id)),
  ];
}

export function getClassFeatureActions(className: string, level: number, ruleset: RulesetId): ClassFeatureAction[] {
  const key = className.trim().toLowerCase();
  const actions: Record<string, ClassFeatureAction[]> = {
    barbarian: [{ id: "rage", name: "Rage", actionType: "Bonus Action", resourceId: "rage", summary: "Rage başlat; class savunma ve hasar bonuslarını takip et." }],
    bard: [{ id: "bardic-inspiration", name: "Bardic Inspiration", actionType: "Bonus Action", resourceId: "bardic-inspiration", summary: "Bir müttefiğe Bardic Inspiration die ver." }],
    cleric: [{ id: "channel-divinity", name: "Channel Divinity", actionType: "Action", resourceId: "channel-divinity", summary: "Class veya domain Channel Divinity seçeneğini kullan." }],
    druid: [{ id: "wild-shape", name: "Wild Shape", actionType: ruleset === "dnd_2024" ? "Bonus Action" : "Action", resourceId: "wild-shape", summary: "Wild Shape kullanımını harca ve form özelliklerini uygula." }],
    fighter: [{ id: "second-wind", name: "Second Wind", actionType: "Bonus Action", resourceId: "second-wind", summary: "Kendini iyileştirmek için bir kullanım harca." }, ...(level >= 2 ? [{ id: "action-surge", name: "Action Surge", actionType: "Passive", resourceId: "action-surge", summary: "Turunda ek bir Action kazan." } as ClassFeatureAction] : [])],
    monk: level >= 2 ? [{ id: "flurry", name: "Flurry of Blows", actionType: "Bonus Action", resourceId: "focus-points", summary: "Focus/Ki harcayarak ilave Unarmed Strike yap." }] : [],
    paladin: [{ id: "lay-on-hands", name: "Lay on Hands", actionType: "Action", resourceId: "lay-on-hands", summary: "Havuzdan puan harcayarak hedefi iyileştir." }],
    ranger: ruleset === "dnd_2024" ? [{ id: "favored-enemy", name: "Favored Enemy", actionType: "Bonus Action", resourceId: "favored-enemy", summary: "Ücretsiz Hunter's Mark kullanımını takip et." }] : [],
    rogue: [], sorcerer: level >= 2 ? [{ id: "font-of-magic", name: "Font of Magic", actionType: "Bonus Action", resourceId: "sorcery-points", summary: "Sorcery Points ve spell slotları arasında dönüşüm yap." }] : [],
    warlock: [], wizard: [{ id: "arcane-recovery", name: "Arcane Recovery", actionType: "Passive", resourceId: "arcane-recovery", summary: "Short Rest sonrasında sınırlı spell slot yenile." }],
  };
  return actions[key] ?? [];
}
