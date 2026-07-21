import type { AbilityKey, CharacterDraft } from "../character/character.types";
import { getGeneralFeatSlotCount, isFeatEligible } from "./featRules";
import { getAsiBudget, getSpentAsi } from "./highLevelAbilityBuilder";
import { getFightingStyleChoiceCount, getFightingStyles } from "./fightingStyleRules";
import { getWeaponMastery, getWeaponMasteryChoiceCount } from "./equipmentRules";
import { getMetamagicChoiceCount, getMetamagicOptions } from "./metamagicRules";
import { getEldritchInvocations, getInvocationChoiceCount, isInvocationEligible } from "./invocationRules";
import { getWildShapeForms, getWildShapeKnownCount, isWildShapeFormEligible } from "./wildShapeRules";
import { getBattleMasterManeuvers, getManeuverChoiceCount } from "./maneuverRules";
import { getCompanionChoiceCount, getRangerCompanions } from "./companionRules";
import { getMysticArcanumLevels } from "./pactMagicRules";
import { getSpellcastingProfile } from "./spellcastingRules";
import { isSpellAvailableToClass } from "./spellRules";
import type { RulesetData } from "./ruleset.types";

const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

function uniqueLimited(values: readonly string[] | undefined, limit: number, allowed?: ReadonlySet<string>) {
  const result: string[] = [];
  for (const value of values ?? []) {
    if (result.length >= limit) break;
    if (result.includes(value)) continue;
    if (allowed && !allowed.has(value)) continue;
    result.push(value);
  }
  return result;
}

function trimAbilityIncreases(
  increases: CharacterDraft["abilityScoreIncreases"],
  budget: number,
): CharacterDraft["abilityScoreIncreases"] {
  if (!increases || getSpentAsi(increases) <= budget) return increases ?? {};
  let remaining = budget;
  const result: CharacterDraft["abilityScoreIncreases"] = {};
  for (const key of ABILITIES) {
    if (remaining <= 0) break;
    const amount = Math.max(0, Math.floor(increases[key] ?? 0));
    const kept = Math.min(amount, remaining);
    if (kept) result[key] = kept;
    remaining -= kept;
  }
  return result;
}

/**
 * Removes selections that became illegal after edition, class, subclass or level changes.
 * The function never invents mandatory choices; validation continues to report missing choices.
 */
export function normalizeDraftForProgression(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): CharacterDraft {
  const level = Math.max(1, Math.min(20, Math.floor(draft.level || 1)));
  const classData = rulesetData?.classes.find((item) => item.name === draft.className) ?? null;
  const validSubclass = rulesetData?.subclasses.find(
    (item) => item.name === draft.subclass && item.className === draft.className,
  );
  const subclass = classData && validSubclass && level >= validSubclass.selectionLevel ? draft.subclass : "";

  let next: CharacterDraft = {
    ...draft,
    level,
    subclass,
    classLevels: draft.classLevels?.length === 1
      ? [{ ...draft.classLevels[0], className: draft.className, level, subclass: subclass || undefined }]
      : draft.classLevels,
  };

  if (!classData) {
    return {
      ...next,
      subclass: "",
      featIds: [],
      fightingStyleIds: [],
      masteredWeaponIds: [],
      metamagicIds: [],
      invocationIds: [],
      wildShapeFormIds: [],
      maneuverIds: [],
      companionId: undefined,
      arcanumSpellIds: [],
      usedArcanumSpellIds: [],
      knownSpellIds: [],
      preparedSpellIds: [],
      spellSlots: [],
      pactMagicSlots: [],
      abilityScoreIncreases: {},
    };
  }

  const spellProfile = getSpellcastingProfile(classData, level, next.abilities, next.ruleset, subclass);
  const canCastSpells = Boolean(spellProfile.spellListClass);
  const featLimit = getGeneralFeatSlotCount(level, next.className, next.ruleset);
  const featMap = new Map((rulesetData?.feats ?? []).map((feat) => [feat.id, feat]));
  const featIds = uniqueLimited(next.featIds, featLimit).filter((id) => {
    const feat = featMap.get(id);
    return Boolean(feat && isFeatEligible(feat, {
      level,
      className: next.className,
      abilities: next.abilities,
      canCastSpells,
      armorTraining: classData.armorProficiencies,
      hasFightingStyleFeature: getFightingStyleChoiceCount(next.className, level, subclass) > 0,
    }).eligible);
  });

  const styleAllowed = new Set(getFightingStyles(next.ruleset).map((item) => item.id));
  const fightingStyleIds = uniqueLimited(
    next.fightingStyleIds,
    getFightingStyleChoiceCount(next.className, level, subclass),
    styleAllowed,
  );

  const masteryAllowed = new Set(
    (rulesetData?.items ?? [])
      .filter((item) => getWeaponMastery(item, next.ruleset))
      .map((item) => item.id),
  );
  const masteredWeaponIds = uniqueLimited(
    next.masteredWeaponIds,
    getWeaponMasteryChoiceCount(classData, level, next.ruleset),
    masteryAllowed,
  );

  const metamagicAllowed = new Set(getMetamagicOptions(next.ruleset).map((item) => item.id));
  const metamagicIds = uniqueLimited(
    next.metamagicIds,
    getMetamagicChoiceCount(next.className, level, next.ruleset),
    metamagicAllowed,
  );

  const invocationMap = new Map(getEldritchInvocations(next.ruleset).map((item) => [item.id, item]));
  const invocationIds = uniqueLimited(
    next.invocationIds,
    getInvocationChoiceCount(next.className, level, next.ruleset),
  ).filter((id) => {
    const invocation = invocationMap.get(id);
    return Boolean(invocation && isInvocationEligible(invocation, { ...next, level }));
  });

  const wildShapeMap = new Map(getWildShapeForms().map((item) => [item.id, item]));
  const wildShapeFormIds = uniqueLimited(
    next.wildShapeFormIds,
    getWildShapeKnownCount(next.className, level, next.ruleset),
  ).filter((id) => {
    const form = wildShapeMap.get(id);
    return Boolean(form && isWildShapeFormEligible(form, level, next.ruleset, subclass));
  });

  const maneuverAllowed = new Set(getBattleMasterManeuvers().map((item) => item.id));
  const maneuverIds = uniqueLimited(
    next.maneuverIds,
    getManeuverChoiceCount(next.className, subclass, level, next.ruleset),
    maneuverAllowed,
  );

  const companionLimit = getCompanionChoiceCount(next.className, subclass, level);
  const companionAllowed = new Set(getRangerCompanions(next.ruleset).map((item) => item.id));
  const companionId = companionLimit === 1 && next.companionId && companionAllowed.has(next.companionId)
    ? next.companionId
    : undefined;

  const spellMap = new Map((rulesetData?.spells ?? []).map((spell) => [spell.id, spell]));
  const spellListClass = spellProfile.spellListClass;
  const eligibleSpells = (next.knownSpellIds ?? []).filter((id) => {
    const spell = spellMap.get(id);
    return Boolean(
      spell
      && spellListClass
      && isSpellAvailableToClass(spell, spellListClass)
      && (spell.level === 0 || spell.level <= spellProfile.maxSpellLevel),
    );
  });
  const cantrips = eligibleSpells.filter((id) => spellMap.get(id)?.level === 0).slice(0, spellProfile.cantripLimit);
  const leveled = eligibleSpells.filter((id) => (spellMap.get(id)?.level ?? 0) > 0);
  const leveledLimit = spellProfile.knownSpellLimit ?? Number.POSITIVE_INFINITY;
  const knownSpellIds = [...cantrips, ...leveled.slice(0, leveledLimit)];
  const preparedLimit = spellProfile.preparedSpellLimit ?? Number.POSITIVE_INFINITY;
  const preparedSpellIds = (next.preparedSpellIds ?? [])
    .filter((id) => knownSpellIds.includes(id) && (spellMap.get(id)?.level ?? 0) > 0)
    .slice(0, preparedLimit);

  const arcanumLevels = getMysticArcanumLevels(next.className, level, next.ruleset);
  const arcanumSpellIds = arcanumLevels.flatMap((spellLevel) => {
    const id = (next.arcanumSpellIds ?? []).find((candidate) => {
      const spell = spellMap.get(candidate);
      return spell?.level === spellLevel && spell.classes.some((name) => name.toLowerCase() === "warlock");
    });
    return id ? [id] : [];
  });

  next = {
    ...next,
    featIds,
    featChoices: Object.fromEntries(Object.entries(next.featChoices ?? {}).filter(([id]) => featIds.includes(id))),
    fightingStyleIds,
    masteredWeaponIds,
    metamagicIds,
    invocationIds,
    wildShapeFormIds,
    maneuverIds,
    companionId,
    companionCurrentHp: companionId ? next.companionCurrentHp : undefined,
    arcanumSpellIds,
    usedArcanumSpellIds: (next.usedArcanumSpellIds ?? []).filter((id) => arcanumSpellIds.includes(id)),
    knownSpellIds,
    preparedSpellIds,
    abilityScoreIncreases: trimAbilityIncreases(
      next.abilityScoreIncreases,
      getAsiBudget(level, next.className, next.ruleset, featIds.length),
    ),
  };

  return next;
}
