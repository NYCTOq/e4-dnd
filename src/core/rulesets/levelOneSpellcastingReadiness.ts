import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getSpellcastingProfile } from "./spellcastingRules";

export type LevelOneSpellcastingReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

export function getLevelOneSpellcastingReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneSpellcastingReadiness {
  if (!rulesetData) return { applicable: false, ready: false, blockers: ["Ruleset verisi yüklenmeden büyü hazırlığı doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };

  const classData = rulesetData.classes.find((item) => item.name === draft.className) ?? null;
  const profile = getSpellcastingProfile(classData, draft.level, draft.abilities, draft.ruleset, draft.subclass);
  const applicable = profile.cantripLimit > 0 || (profile.knownSpellLimit ?? 0) > 0 || (profile.preparedSpellLimit ?? 0) > 0;
  if (!applicable) return { applicable: false, ready: true, blockers: [], notices: ["Bu class/level için spell seçimi gerekmiyor."], completedChecks: 0, totalChecks: 0, summary: [] };

  const spellMap = new Map(rulesetData.spells.map((spell) => [spell.id, spell]));
  const knownIds = [...new Set(draft.knownSpellIds ?? [])];
  const preparedIds = [...new Set(draft.preparedSpellIds ?? [])];
  const alwaysPrepared = new Set(alwaysPreparedSpellIds);
  const cantripIds = [...new Set([...knownIds, ...preparedIds])].filter((id) => spellMap.get(id)?.level === 0);
  const knownLeveled = knownIds.filter((id) => (spellMap.get(id)?.level ?? 0) > 0);
  const preparedLeveled = preparedIds.filter((id) => (spellMap.get(id)?.level ?? 0) > 0 && !alwaysPrepared.has(id));
  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  if (profile.cantripLimit > 0) {
    const complete = cantripIds.length === profile.cantripLimit;
    checks.push(complete); summary.push(`Cantrip ${cantripIds.length}/${profile.cantripLimit}`);
    if (!complete) blockers.push(`${profile.cantripLimit} cantrip seçilmeli; şu anda ${cantripIds.length} seçili.`);
  }
  if (profile.knownSpellLimit !== null && profile.knownSpellLimit > 0) {
    const complete = knownLeveled.length === profile.knownSpellLimit;
    checks.push(complete); summary.push(`Known spell ${knownLeveled.length}/${profile.knownSpellLimit}`);
    if (!complete) blockers.push(`${profile.knownSpellLimit} seviyeli known spell seçilmeli; şu anda ${knownLeveled.length} seçili.`);
  }
  if (profile.preparedSpellLimit !== null && profile.preparedSpellLimit > 0) {
    const complete = preparedLeveled.length === profile.preparedSpellLimit;
    checks.push(complete); summary.push(`Prepared spell ${preparedLeveled.length}/${profile.preparedSpellLimit}`);
    if (!complete) blockers.push(`${profile.preparedSpellLimit} seviyeli prepared spell seçilmeli; şu anda ${preparedLeveled.length} seçili.`);
    if (alwaysPrepared.size) notices.push(`${alwaysPrepared.size} Always Prepared spell normal prepared kotasını tüketmiyor.`);
  }
  const invalidSpellIds = [...new Set([...knownIds, ...preparedIds])].filter((id) => !spellMap.has(id));
  const validReferences = invalidSpellIds.length === 0;
  checks.push(validReferences);
  if (!validReferences) blockers.push(`${invalidSpellIds.length} spell kaydı katalogda bulunmuyor.`);

  return { applicable, ready: blockers.length === 0, blockers, notices, completedChecks: checks.filter(Boolean).length, totalChecks: checks.length, summary };
}
