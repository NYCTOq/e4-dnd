import type { CharacterDraft } from "../character/character.types";
import type { AbilityKey } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";

export type LevelOneOriginReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

const unique = <T,>(values: T[]) => [...new Set(values)];

export function getLevelOneOriginReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneOriginReadiness {
  if (!rulesetData) {
    return { applicable: false, ready: false, blockers: ["Ruleset verisi yüklenmeden origin doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const background = rulesetData.backgrounds.find((item) => item.name === draft.background) ?? null;
  if (!background) {
    return { applicable: false, ready: false, blockers: ["Geçerli bir background seçilmeli."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const backgroundValid = Boolean(background.id && background.name && background.skillProficiencies.length);
  checks.push(backgroundValid);
  summary.push(`Background ${background.name}`);
  if (!backgroundValid) blockers.push("Background kaydı eksik veya mekanik verisi tamamlanmamış.");

  if (draft.ruleset === "dnd_2024") {
    const options = unique(background.abilityOptions ?? []);
    const optionSet = new Set<AbilityKey>(options);
    const mode = draft.originAbilityMode ?? (background.abilityBonusMode === "2024-three-ones" ? "1-1-1" : "2-1");
    const selected = mode === "1-1-1"
      ? [draft.originAbilityPrimary, draft.originAbilitySecondary, draft.originAbilityTertiary]
      : [draft.originAbilityPrimary, draft.originAbilitySecondary];
    const defined = selected.filter((item): item is AbilityKey => Boolean(item));
    const abilityReady = options.length === 3
      && defined.length === selected.length
      && unique(defined).length === defined.length
      && defined.every((item) => optionSet.has(item));
    checks.push(abilityReady);
    summary.push(`Ability dağılımı ${mode === "1-1-1" ? "+1/+1/+1" : "+2/+1"}`);
    if (!abilityReady) blockers.push(`Background ability dağılımı, izin verilen ${options.map((item) => item.toUpperCase()).join(", ")} seçenekleriyle tamamlanmalı.`);

    const originFeat = background.originFeat?.trim() ?? "";
    const catalogFeat = rulesetData.feats.find((feat) => feat.name === originFeat) ?? null;
    const originFeatReady = Boolean(originFeat && catalogFeat?.category === "origin");
    checks.push(originFeatReady);
    summary.push(`Origin Feat ${originFeat || "eksik"}`);
    if (!originFeatReady) blockers.push("Background Origin Feat kaydı resmî Origin feat kataloğuna bağlı değil.");

    const selectedFeatNames = new Set(rulesetData.feats.filter((feat) => draft.featIds.includes(feat.id)).map((feat) => feat.name));
    const noDuplicateOriginFeat = !originFeat || !selectedFeatNames.has(originFeat);
    checks.push(noDuplicateOriginFeat);
    if (!noDuplicateOriginFeat) blockers.push(`${originFeat}, background tarafından zaten verildiği için ayrıca feat olarak seçilemez.`);
  } else {
    const featureReady = Boolean(background.feature?.trim());
    checks.push(featureReady);
    summary.push(`Background Feature ${background.feature || "eksik"}`);
    if (!featureReady) blockers.push("2014 background feature kaydı eksik.");
    notices.push("2014 background ability skorlarını değiştirmez.");
  }

  if (background.skillProficiencies.length) notices.push(`Background skillleri: ${background.skillProficiencies.join(", ")}.`);

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
