import type { CharacterDraft, CharacterResource } from "../character/character.types";
import { getClassFeatureActions, getClassResources } from "./classFeatureEngine";
import type { DndSpellData, RulesetData } from "./ruleset.types";

export type LevelOneActionEconomyReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

function validResource(resource: CharacterResource) {
  return Boolean(resource.id.trim() && resource.name.trim())
    && Number.isFinite(resource.max)
    && Number.isFinite(resource.used)
    && resource.max >= 0
    && resource.used >= 0
    && (resource.unlimited || resource.used <= resource.max);
}

function validCastingTime(spell: DndSpellData) {
  return /action|bonus action|reaction|minute|hour|ritual/i.test(spell.castingTime ?? "");
}

export function getLevelOneActionEconomyReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneActionEconomyReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden action economy profili doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];
  const level = Math.max(1, Math.floor(draft.level || 1));

  const selectedClass = rulesetData.classes.find((entry) => normalize(entry.name) === normalize(draft.className));
  const classValid = Boolean(selectedClass);
  checks.push(classValid);
  if (!classValid) blockers.push("Action economy kontrolü için geçerli bir class seçilmeli.");

  const resources = draft.resources ?? [];
  const resourcesValid = resources.every(validResource)
    && new Set(resources.map((resource) => normalize(resource.id))).size === resources.length;
  checks.push(resourcesValid);
  if (!resourcesValid) blockers.push("Class resource kayıtları benzersiz ve geçerli kullanım sınırlarında olmalı.");

  const expectedResources = selectedClass
    ? getClassResources(selectedClass.name, level, draft.abilities, draft.ruleset, draft.subclass)
    : [];
  const missingResources = expectedResources.filter((expected) => !resources.some((resource) => normalize(resource.id) === normalize(expected.id)));
  const expectedResourcesPresent = missingResources.length === 0;
  checks.push(expectedResourcesPresent);
  if (!expectedResourcesPresent) blockers.push(`Eksik class resource: ${missingResources.map((resource) => resource.name).join(", ")}.`);

  const actions = selectedClass ? getClassFeatureActions(selectedClass.name, level, draft.ruleset) : [];
  const actionResourcesValid = actions.every((action) => !action.resourceId || resources.some((resource) => normalize(resource.id) === normalize(action.resourceId!)));
  checks.push(actionResourcesValid);
  if (!actionResourcesValid) {
    const broken = actions.filter((action) => action.resourceId && !resources.some((resource) => normalize(resource.id) === normalize(action.resourceId!)));
    blockers.push(`Kaynak bağlantısı eksik class action: ${broken.map((action) => action.name).join(", ")}.`);
  }

  const selectedSpellIds = [...new Set([...(draft.knownSpellIds ?? []), ...(draft.preparedSpellIds ?? []), ...alwaysPreparedSpellIds])];
  const selectedSpells = selectedSpellIds
    .map((id) => rulesetData.spells.find((spell) => spell.id === id))
    .filter((spell): spell is DndSpellData => Boolean(spell));
  const spellReferencesValid = selectedSpells.length === selectedSpellIds.length;
  checks.push(spellReferencesValid);
  if (!spellReferencesValid) blockers.push("Action economy kontrolünde katalogda bulunmayan spell referansı var.");

  const spellCastingTimesValid = selectedSpells.every(validCastingTime);
  checks.push(spellCastingTimesValid);
  if (!spellCastingTimesValid) {
    blockers.push(`Casting Time kaydı geçersiz spell: ${selectedSpells.filter((spell) => !validCastingTime(spell)).map((spell) => spell.name).join(", ")}.`);
  }

  const actionCount = actions.filter((action) => action.actionType === "Action").length;
  const bonusActionCount = actions.filter((action) => action.actionType === "Bonus Action").length;
  const reactionCount = actions.filter((action) => action.actionType === "Reaction").length;
  const passiveCount = actions.filter((action) => action.actionType === "Passive").length;
  if (actions.length) summary.push(`Class actions A${actionCount} · BA${bonusActionCount} · R${reactionCount} · P${passiveCount}`);
  if (resources.length) summary.push(`Resources ${resources.map((resource) => `${resource.name} ${resource.unlimited ? "∞" : `${resource.max - resource.used}/${resource.max}`}`).slice(0, 4).join(", ")}`);

  const actionSpells = selectedSpells.filter((spell) => /(^|\b)action\b/i.test(spell.castingTime) && !/bonus action|reaction/i.test(spell.castingTime));
  const bonusSpells = selectedSpells.filter((spell) => /bonus action/i.test(spell.castingTime));
  const reactionSpells = selectedSpells.filter((spell) => /reaction/i.test(spell.castingTime));
  if (selectedSpells.length) summary.push(`Spell economy A${actionSpells.length} · BA${bonusSpells.length} · R${reactionSpells.length}`);

  if (!actions.length && !selectedSpells.length) notices.push("Level 1 için özel class action veya spell action görünmüyor; temel Attack, Dash, Dodge ve Help seçenekleri kullanılabilir.");
  if (bonusActionCount === 0 && bonusSpells.length === 0) notices.push("Karakterde görünür bir Bonus Action seçeneği yok; bu kurala aykırı değildir.");
  if (reactionCount === 0 && reactionSpells.length === 0) notices.push("Karakterde görünür bir Reaction seçeneği yok; opportunity attack yine temel Reaction seçeneğidir.");

  return {
    applicable: true,
    ready: blockers.length === 0,
    blockers,
    notices,
    completedChecks: checks.filter(Boolean).length,
    totalChecks: checks.length,
    summary,
  };
}
