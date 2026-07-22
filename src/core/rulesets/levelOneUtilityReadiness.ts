import type { CharacterDraft } from "../character/character.types";
import type { DndSpellData, RulesetData } from "./ruleset.types";

export type LevelOneUtilityReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

function normalizedUnique(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const raw of values) {
    const value = raw.trim().toLowerCase();
    if (!value) continue;
    if (seen.has(value)) duplicates.add(raw.trim());
    seen.add(value);
  }
  return [...duplicates];
}

function isUtilitySpell(spell: DndSpellData) {
  return spell.effectType === "utility" || spell.effectType === "movement" || spell.ritual || spell.tags?.some((tag) => ["exploration", "utility", "travel", "social"].includes(tag.toLowerCase()));
}

export function getLevelOneUtilityReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneUtilityReadiness {
  if (!rulesetData) {
    return { applicable: false, ready: false, blockers: ["Ruleset verisi yüklenmeden keşif hazırlığı doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const race = rulesetData.races.find((candidate) => candidate.name === draft.race) ?? null;
  const background = rulesetData.backgrounds.find((candidate) => candidate.name === draft.background) ?? null;
  if (!race) {
    return { applicable: false, ready: false, blockers: ["Race/Species seçilmeden hareket ve keşif hazırlığı doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const equippedIds = new Set([...(draft.equippedWeaponIds ?? []), draft.equippedArmorId, draft.equippedShieldId].filter((value): value is string => Boolean(value)));
  const speedBonus = rulesetData.items
    .filter((item) => equippedIds.has(item.id))
    .reduce((total, item) => total + (item.speedBonus ?? 0), 0);
  const speed = race.speed + speedBonus;
  const speedValid = Number.isFinite(speed) && speed > 0;
  checks.push(speedValid);
  if (!speedValid) blockers.push("Race/Species için geçerli bir hareket hızı bulunmalı.");
  else summary.push(`Speed ${speed} ft${speedBonus ? ` (${speedBonus >= 0 ? "+" : ""}${speedBonus})` : ""}`);

  const languageDuplicates = findDuplicates(draft.languages);
  const toolDuplicates = findDuplicates(draft.toolProficiencies);
  const languageDataValid = draft.languages.every((value) => value.trim().length > 0) && languageDuplicates.length === 0;
  const toolDataValid = draft.toolProficiencies.every((value) => value.trim().length > 0) && toolDuplicates.length === 0;
  checks.push(languageDataValid, toolDataValid);
  if (!languageDataValid) blockers.push(languageDuplicates.length ? `Tekrarlanan language kayıtları: ${languageDuplicates.join(", ")}.` : "Boş language kaydı temizlenmeli.");
  if (!toolDataValid) blockers.push(toolDuplicates.length ? `Tekrarlanan tool proficiency kayıtları: ${toolDuplicates.join(", ")}.` : "Boş tool proficiency kaydı temizlenmeli.");
  summary.push(`Languages ${normalizedUnique(draft.languages).size}`, `Tools ${normalizedUnique(draft.toolProficiencies).size}`);

  const grantedLanguages = [...(race.languages ?? []), ...(background?.languages ?? [])];
  const missingGrantedLanguages = grantedLanguages.filter((language) => !normalizedUnique(draft.languages).has(language.toLowerCase()));
  if (missingGrantedLanguages.length) notices.push(`Race/Background tarafından verilen language kayıtları karakter listesinde görünmüyor: ${missingGrantedLanguages.join(", ")}.`);

  const grantedTools = background?.toolProficiencies ?? [];
  const missingGrantedTools = grantedTools.filter((tool) => !normalizedUnique(draft.toolProficiencies).has(tool.toLowerCase()));
  if (missingGrantedTools.length) notices.push(`Background tarafından verilen tool proficiency kayıtları karakter listesinde görünmüyor: ${missingGrantedTools.join(", ")}.`);

  const selectedSpellIds = [...new Set([...(draft.knownSpellIds ?? []), ...(draft.preparedSpellIds ?? []), ...alwaysPreparedSpellIds])];
  const selectedSpells = selectedSpellIds.map((id) => rulesetData.spells.find((spell) => spell.id === id)).filter((spell): spell is DndSpellData => Boolean(spell));
  const spellReferencesValid = selectedSpells.length === selectedSpellIds.length;
  checks.push(spellReferencesValid);
  if (!spellReferencesValid) blockers.push("Seçili spell listesinde katalogda bulunmayan kayıtlar var.");

  const utilitySpells = selectedSpells.filter(isUtilitySpell);
  if (utilitySpells.length) summary.push(`Utility: ${utilitySpells.slice(0, 4).map((spell) => spell.name).join(", ")}${utilitySpells.length > 4 ? ` +${utilitySpells.length - 4}` : ""}`);
  else if (selectedSpells.length) notices.push("Seçili büyüler arasında exploration, movement, ritual veya utility seçeneği görünmüyor.");

  if (race.darkvision) summary.push(`Darkvision ${race.darkvision} ft`);
  const mobilityTraits = race.traits.filter((trait) => /fly|flight|swim|climb|teleport|speed/i.test(trait));
  if (mobilityTraits.length) summary.push(`Mobility traits ${mobilityTraits.length}`);

  const hasExplorationSupport = utilitySpells.length > 0 || draft.toolProficiencies.length > 0 || draft.languages.length > 0 || Boolean(race.darkvision) || mobilityTraits.length > 0;
  checks.push(hasExplorationSupport);
  if (!hasExplorationSupport) notices.push("Karakterde görünür bir exploration, language, tool, darkvision veya utility spell seçeneği yok.");

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
