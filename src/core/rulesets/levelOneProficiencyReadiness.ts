import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { buildFinalSkillProficiencies, normalizeClassSkillChoices, normalizeExpertise } from "./proficiencyRules";

export type LevelOneProficiencyReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

export function getLevelOneProficiencyReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneProficiencyReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden proficiency hazırlığı doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const classData = rulesetData.classes.find((item) => item.name === draft.className) ?? null;
  const background = rulesetData.backgrounds.find((item) => item.name === draft.background) ?? null;
  if (!classData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Class seçilmeden proficiency hazırlığı doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const selectedClassSkills = normalizeClassSkillChoices(draft.skillProficiencies, classData, background);
  const finalSkills = buildFinalSkillProficiencies(draft.skillProficiencies, classData, background);
  const expertise = normalizeExpertise(draft.expertiseSkills, finalSkills, draft.expertiseSkills.length);
  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const classSkillReady = selectedClassSkills.length === classData.skillChoices.choose;
  checks.push(classSkillReady);
  summary.push(`Class skill ${selectedClassSkills.length}/${classData.skillChoices.choose}`);
  if (!classSkillReady) blockers.push(`${classData.skillChoices.choose} class skill seçilmeli; şu anda ${selectedClassSkills.length} seçili.`);

  const expertiseValid = expertise.length === draft.expertiseSkills.length && draft.expertiseSkills.every((skill) => finalSkills.includes(skill));
  checks.push(expertiseValid);
  summary.push(`Toplam proficient skill ${finalSkills.length}`);
  if (!expertiseValid) blockers.push("Expertise yalnız proficient olunan ve tekrarsız skilllere uygulanabilir.");

  const noDuplicateSkills = new Set(finalSkills).size === finalSkills.length;
  checks.push(noDuplicateSkills);
  if (!noDuplicateSkills) blockers.push("Skill proficiency listesinde tekrar eden kayıtlar var.");

  const noDuplicateTools = new Set(draft.toolProficiencies).size === draft.toolProficiencies.length;
  const noDuplicateLanguages = new Set(draft.languages).size === draft.languages.length;
  checks.push(noDuplicateTools && noDuplicateLanguages);
  if (!noDuplicateTools) blockers.push("Tool proficiency listesinde tekrar eden kayıtlar var.");
  if (!noDuplicateLanguages) blockers.push("Language listesinde tekrar eden kayıtlar var.");

  notices.push(`Saving throw proficiencies otomatik: ${classData.savingThrows.map((ability) => ability.toUpperCase()).join(", ")}.`);
  if (background?.skillProficiencies.length) notices.push(`Background skillleri otomatik: ${background.skillProficiencies.join(", ")}.`);
  if (classData.armorProficiencies.length) notices.push(`${classData.armorProficiencies.length} armor proficiency kaydı class tarafından veriliyor.`);
  if (classData.weaponProficiencies.length) notices.push(`${classData.weaponProficiencies.length} weapon proficiency kaydı class tarafından veriliyor.`);

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
