import type { Character, CharacterCondition, RulesetId } from "../character/character.types";

export type ClassFeatureRuntimePlan = {
  id: string;
  name: string;
  resourceId?: string;
  resourceCost: number;
  actionType: "Action" | "Bonus Action" | "Reaction" | "Free" | "Passive";
  healingFormula?: string;
  appliesCondition?: CharacterCondition;
  concentration?: boolean;
  duration?: string;
  summary: string;
};

const key = (value: string) => value.trim().toLowerCase();

export function getClassFeatureRuntimePlan(
  className: string,
  featureId: string,
  level: number,
  ruleset: RulesetId,
): ClassFeatureRuntimePlan | null {
  const classKey = key(className);
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level)));
  const featureKey = key(featureId);

  if (classKey === "barbarian" && featureKey === "rage") {
    return {
      id: "rage",
      name: "Rage",
      resourceId: "rage",
      resourceCost: 1,
      actionType: "Bonus Action",
      appliesCondition: "Rage",
      duration: ruleset === "dnd_2024" ? "10 minutes" : "1 minute",
      summary: "Rage kullanımını harcar ve Rage condition durumunu etkinleştirir.",
    };
  }

  if (classKey === "fighter" && featureKey === "second-wind") {
    return {
      id: "second-wind",
      name: "Second Wind",
      resourceId: "second-wind",
      resourceCost: 1,
      actionType: "Bonus Action",
      healingFormula: ruleset === "dnd_2024" ? `1d10+${safeLevel}` : `1d10+${safeLevel}`,
      summary: "Bir kullanım harcar ve Fighter seviyesini içeren iyileştirme uygular.",
    };
  }

  if (classKey === "fighter" && featureKey === "action-surge" && safeLevel >= 2) {
    return {
      id: "action-surge",
      name: "Action Surge",
      resourceId: "action-surge",
      resourceCost: 1,
      actionType: "Free",
      summary: ruleset === "dnd_2024"
        ? "Turunda ek bir Action verir; Magic action ile yalnız bir spell cast edilebilir."
        : "Turunda ek bir Action verir.",
    };
  }

  if (classKey === "bard" && featureKey === "bardic-inspiration") {
    return {
      id: "bardic-inspiration",
      name: "Bardic Inspiration",
      resourceId: "bardic-inspiration",
      resourceCost: 1,
      actionType: "Bonus Action",
      summary: "Bir Bardic Inspiration kullanımı harcar.",
    };
  }

  if ((classKey === "cleric" || classKey === "paladin") && featureKey === "channel-divinity") {
    return {
      id: "channel-divinity",
      name: "Channel Divinity",
      resourceId: "channel-divinity",
      resourceCost: 1,
      actionType: "Action",
      summary: "Bir Channel Divinity kullanımı harcar; seçilen class veya subclass etkisi ayrıca çözülür.",
    };
  }

  if (classKey === "druid" && featureKey === "wild-shape" && safeLevel >= 2) {
    return {
      id: "wild-shape",
      name: "Wild Shape",
      resourceId: "wild-shape",
      resourceCost: 1,
      actionType: ruleset === "dnd_2024" ? "Bonus Action" : "Action",
      summary: "Bir Wild Shape kullanımı harcar ve seçili form runtime'ını etkinleştirir.",
    };
  }

  if (classKey === "monk" && ["flurry", "patient-defense", "step-of-the-wind"].includes(featureKey) && safeLevel >= 2) {
    const names: Record<string, string> = {
      flurry: "Flurry of Blows",
      "patient-defense": "Patient Defense",
      "step-of-the-wind": "Step of the Wind",
    };
    return {
      id: featureKey,
      name: names[featureKey],
      resourceId: "focus-points",
      resourceCost: 1,
      actionType: "Bonus Action",
      summary: "Bir Focus/Ki Point harcar ve seçilen Monk bonus action etkisini uygular.",
    };
  }

  if (classKey === "paladin" && featureKey === "lay-on-hands") {
    return {
      id: "lay-on-hands",
      name: "Lay on Hands",
      resourceId: "lay-on-hands",
      resourceCost: 1,
      actionType: ruleset === "dnd_2024" ? "Bonus Action" : "Action",
      summary: "Seçilen miktar kadar Lay on Hands havuzu harcar ve HP iyileştirir.",
    };
  }

  if (classKey === "sorcerer" && featureKey === "font-of-magic" && safeLevel >= 2) {
    return {
      id: "font-of-magic",
      name: "Font of Magic",
      resourceId: "sorcery-points",
      resourceCost: 1,
      actionType: "Bonus Action",
      summary: "Sorcery Point ve spell slot dönüşümü için kaynak harcamasını doğrular.",
    };
  }

  if (classKey === "ranger" && featureKey === "favored-enemy" && ruleset === "dnd_2024") {
    return {
      id: "favored-enemy",
      name: "Favored Enemy",
      resourceId: "favored-enemy",
      resourceCost: 1,
      actionType: "Bonus Action",
      concentration: true,
      summary: "Ücretsiz Hunter's Mark kullanımını harcar ve Concentration durumunu etkinleştirir.",
    };
  }

  if (classKey === "wizard" && featureKey === "arcane-recovery") {
    return {
      id: "arcane-recovery",
      name: "Arcane Recovery",
      resourceId: "arcane-recovery",
      resourceCost: 1,
      actionType: "Passive",
      summary: "Short Rest sonunda seçilen spell slotlarını limit dahilinde yeniler.",
    };
  }

  return null;
}

export function getRemainingClassResource(character: Character, resourceId: string) {
  const resource = character.resources.find((item) => item.id === resourceId);
  if (!resource) return 0;
  return resource.unlimited ? Number.POSITIVE_INFINITY : Math.max(0, resource.max - resource.used);
}

export function canUseClassFeature(character: Character, plan: ClassFeatureRuntimePlan, amount = plan.resourceCost) {
  if (!plan.resourceId) return true;
  const safeAmount = Math.max(0, Math.floor(amount));
  return getRemainingClassResource(character, plan.resourceId) >= safeAmount;
}

export function applyClassFeatureUse(
  character: Character,
  plan: ClassFeatureRuntimePlan,
  options: { amount?: number; healing?: number } = {},
): Character {
  const amount = Math.max(0, Math.floor(options.amount ?? plan.resourceCost));
  if (!canUseClassFeature(character, plan, amount)) return character;

  const resources = plan.resourceId
    ? character.resources.map((resource) =>
        resource.id === plan.resourceId && !resource.unlimited
          ? { ...resource, used: Math.min(resource.max, resource.used + amount) }
          : resource,
      )
    : character.resources;

  const conditions = [...character.conditions];
  if (plan.appliesCondition && !conditions.includes(plan.appliesCondition)) conditions.push(plan.appliesCondition);
  if (plan.concentration && !conditions.includes("Concentration")) conditions.push("Concentration");

  const healing = Math.max(0, Math.floor(options.healing ?? 0));
  const currentHp = Math.min(character.maxHp, character.currentHp + healing);

  return {
    ...character,
    resources,
    conditions,
    currentHp,
    updatedAt: new Date().toISOString(),
  };
}

export function endClassFeatureCondition(character: Character, condition: CharacterCondition): Character {
  if (!character.conditions.includes(condition)) return character;
  const conditionDurations = { ...character.conditionDurations };
  delete conditionDurations[condition];
  return {
    ...character,
    conditions: character.conditions.filter((item) => item !== condition),
    conditionDurations,
    updatedAt: new Date().toISOString(),
  };
}
