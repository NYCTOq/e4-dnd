import type { AbilityKey, CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getAncestryRuntime } from "./ancestryRuntimeRules";

export type LevelOneAncestryReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

const unique = <T,>(values: T[]) => [...new Set(values)];

export function getLevelOneAncestryReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneAncestryReadiness {
  if (!rulesetData) {
    return { applicable: false, ready: false, blockers: ["Ruleset verisi yüklenmeden ancestry doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const race = rulesetData.races.find((item) => item.name === draft.race) ?? null;
  if (!race) {
    return { applicable: false, ready: false, blockers: ["Geçerli bir Race/Species seçilmeli."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const coreRecordReady = Boolean(race.id && race.name && race.speed > 0 && race.size && race.traits.length);
  checks.push(coreRecordReady);
  summary.push(`${draft.ruleset === "dnd_2024" ? "Species" : "Race"} ${race.name}`);
  summary.push(`Speed ${race.speed} ft`);
  summary.push(`Size ${race.size}`);
  if (!coreRecordReady) blockers.push("Race/Species kaydında hız, boyut veya trait verisi eksik.");

  const uniqueTraits = unique(race.traits);
  const traitsReady = uniqueTraits.length === race.traits.length && uniqueTraits.every((trait) => trait.trim().length > 0);
  checks.push(traitsReady);
  if (!traitsReady) blockers.push("Race/Species trait listesinde boş veya tekrarlanan kayıt var.");

  if (draft.ruleset === "dnd_2014") {
    const requiresSubrace = Boolean(race.subraces?.length);
    const selectedSubrace = race.subraces?.find((item) => item.name === draft.subrace) ?? null;
    const subraceReady = !requiresSubrace || Boolean(selectedSubrace);
    checks.push(subraceReady);
    if (requiresSubrace) summary.push(`Subrace ${selectedSubrace?.name || "eksik"}`);
    if (!subraceReady) blockers.push(`${race.name} için geçerli bir subrace seçilmeli.`);

    const hasRaceAbilityData = Object.values(race.abilityBonuses).some((value) => (value ?? 0) !== 0);
    const hasSubraceAbilityData = !selectedSubrace || Object.values(selectedSubrace.abilityBonuses ?? {}).some((value) => (value ?? 0) !== 0);
    const abilityDataReady = hasRaceAbilityData && hasSubraceAbilityData;
    checks.push(abilityDataReady);
    if (!abilityDataReady) blockers.push("2014 Race/Subrace ability bonus verisi eksik.");

    if (race.name === "Half-Elf") {
      const choices = [draft.flexibleRaceAbilityPrimary, draft.flexibleRaceAbilitySecondary].filter((item): item is AbilityKey => Boolean(item));
      const flexibleReady = choices.length === 2 && unique(choices).length === 2 && choices.every((item) => item !== "cha");
      checks.push(flexibleReady);
      summary.push(`Esnek ability ${choices.length ? choices.map((item) => item.toUpperCase()).join("/") : "eksik"}`);
      if (!flexibleReady) blockers.push("Half-Elf için CHA dışında iki farklı ability +1 seçilmeli.");
    }
  } else {
    const noSpeciesAbilityBonuses = Object.keys(race.abilityBonuses).length === 0;
    checks.push(noSpeciesAbilityBonuses);
    if (!noSpeciesAbilityBonuses) blockers.push("2024 Species ability skoru vermemeli; ability artışları background üzerinden gelmeli.");

    const noLegacySubrace = !race.subraces?.length;
    checks.push(noLegacySubrace);
    if (!noLegacySubrace) blockers.push("2024 Species kaydı legacy subrace seçimi taşımamalı.");

    if (/Medium or Small/i.test(race.size)) notices.push("Bu Species için karakter boyutu seçimi sonraki UI paketinde ayrı seçim olarak tutulmalı.");
    if (race.traits.some((trait) => /Ancestry|Lineage/i.test(trait))) notices.push("Ancestry/Lineage alt seçimi trait açıklamasına bağlıdır; katalog seçeneği bulunduğunda ayrıca doğrulanmalı.");
  }

  const runtime = getAncestryRuntime(race, draft.subrace, Math.max(1, draft.level));
  const runtimeReady = runtime.darkvision >= 0 && runtime.speedBonus >= 0 && runtime.maxHpBonus >= 0;
  checks.push(runtimeReady);
  if (!runtimeReady) blockers.push("Ancestry runtime değerlerinden biri geçersiz.");
  if (runtime.darkvision) summary.push(`Darkvision ${runtime.darkvision} ft`);
  if (runtime.damageResistances.length) notices.push(`Resistance: ${runtime.damageResistances.join(", ")}.`);
  if (runtime.features.length) notices.push(`Aktif ancestry özellikleri: ${runtime.features.join(", ")}.`);

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
