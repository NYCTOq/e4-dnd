import type { AbilityKey } from "../character/character.types";
import type { HomebrewEntity, HomebrewEntityType, HomebrewPackage, HomebrewRecovery, HomebrewRuntimeAction } from "./homebrewFoundation";
import { createHomebrewPackage, validateHomebrewEntity } from "./homebrewFoundation";

export type HomebrewCreatorDraft = {
  packageId: string;
  packageName: string;
  packageVersion: string;
  packageAuthor: string;
  type: HomebrewEntityType;
  name: string;
  description: string;
  tags: string;
  className: string;
  selectionLevel: number;
  hitDie: number;
  speed: number;
  featRuleset: "dnd_2014" | "dnd_2024";
  resourceName: string;
  resourceMaximum: number;
  resourceRecovery: HomebrewRecovery;
  resourceRecoveryAmount: number;
  actionName: string;
  actionEconomy: HomebrewRuntimeAction["economy"];
  actionSummary: string;
  actionCost: number;
};

export const DEFAULT_HOMEBREW_CREATOR_DRAFT: HomebrewCreatorDraft = {
  packageId: "",
  packageName: "Yeni Homebrew Paketi",
  packageVersion: "1.0.0",
  packageAuthor: "",
  type: "feat",
  name: "",
  description: "",
  tags: "",
  className: "Fighter",
  selectionLevel: 3,
  hitDie: 8,
  speed: 30,
  featRuleset: "dnd_2024",
  resourceName: "",
  resourceMaximum: 1,
  resourceRecovery: "long-rest",
  resourceRecoveryAmount: 1,
  actionName: "",
  actionEconomy: "action",
  actionSummary: "",
  actionCost: 1,
};

export function slugifyHomebrewId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "homebrew";
}

function buildPayload(draft: HomebrewCreatorDraft, id: string) {
  const description = draft.description.trim() || "Homebrew içerik.";
  const common = { id, name: draft.name.trim() };
  switch (draft.type) {
    case "class":
      return {
        ...common,
        hitDie: draft.hitDie,
        primaryAbilities: ["str" as AbilityKey],
        savingThrows: ["str" as AbilityKey, "con" as AbilityKey],
        spellcastingAbility: null,
        armorProficiencies: [],
        weaponProficiencies: [],
        skillChoices: { choose: 2, from: [] },
        description,
        subclassLevel: draft.selectionLevel,
        spellProgression: "none" as const,
        levels: Array.from({ length: 20 }, (_, index) => ({ level: index + 1, proficiencyBonus: 2 + Math.floor(index / 4), features: [] })),
      };
    case "subclass":
      return {
        ...common,
        className: draft.className.trim() || "Fighter",
        ruleset: draft.featRuleset,
        selectionLevel: draft.selectionLevel,
        description,
        features: [{ level: draft.selectionLevel, name: draft.name.trim(), summary: description }],
      };
    case "species":
      return { ...common, speed: draft.speed, size: "Medium", abilityBonuses: {}, traits: [], description };
    case "background":
      return { ...common, description, skillProficiencies: [], toolProficiencies: [], languages: [] };
    case "feat":
      return { ...common, ruleset: draft.featRuleset, category: "general" as const, summary: description, benefits: [description] };
    case "spell":
      return {
        ...common,
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "60 feet",
        components: ["V", "S"],
        duration: "Instantaneous",
        concentration: false,
        ritual: false,
        classes: [],
        description,
        effectType: "utility" as const,
        attackType: "automatic" as const,
        source: "Homebrew",
      };
    case "item":
      return { ...common, category: "gear" as const, cost: "Custom", weight: 0, description, magical: true, tags: ["homebrew"] };
  }
}

export function createEntityFromDraft(draft: HomebrewCreatorDraft): HomebrewEntity {
  const id = `homebrew-${draft.type}-${slugifyHomebrewId(draft.name)}`;
  const now = new Date().toISOString();
  const resourceId = draft.resourceName.trim() ? `resource-${slugifyHomebrewId(draft.resourceName)}` : undefined;
  const resources = resourceId ? [{ id: resourceId, name: draft.resourceName.trim(), maximum: draft.resourceMaximum, recovery: draft.resourceRecovery, recoveryAmount: draft.resourceRecoveryAmount }] : undefined;
  const actions = draft.actionName.trim() || draft.actionSummary.trim() ? [{
    id: `action-${slugifyHomebrewId(draft.actionName || draft.name)}`,
    name: draft.actionName.trim() || draft.name.trim(),
    economy: draft.actionEconomy,
    resourceId,
    resourceCost: resourceId ? draft.actionCost : undefined,
    summary: draft.actionSummary.trim() || draft.description.trim() || "Homebrew action.",
  }] : undefined;
  const entity = {
    schemaVersion: 1 as const,
    type: draft.type,
    id,
    name: draft.name.trim(),
    author: draft.packageAuthor.trim() || undefined,
    description: draft.description.trim() || undefined,
    tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    payload: buildPayload(draft, id),
    resources,
    actions,
    createdAt: now,
    updatedAt: now,
  } as HomebrewEntity;
  const report = validateHomebrewEntity(entity);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return entity;
}

export function createPackageFromDraft(draft: HomebrewCreatorDraft, entities: HomebrewEntity[]): HomebrewPackage {
  return createHomebrewPackage({
    id: draft.packageId.trim() || `package-${slugifyHomebrewId(draft.packageName)}`,
    name: draft.packageName.trim(),
    version: draft.packageVersion.trim(),
    author: draft.packageAuthor.trim() || undefined,
    description: `${draft.packageName.trim()} paketi`,
    entities,
  });
}
