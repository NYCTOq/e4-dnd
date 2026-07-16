import type { AbilityScores, CharacterDraft } from "../character/character.types";
import { getGeneralFeatSlotCount, isFeatEligible } from "./featRules";
import { buildFinalSkillProficiencies, normalizeClassSkillChoices } from "./proficiencyRules";
import { getHighestSpellLevel, isSpellAvailableToClass } from "./spellRules";
import type { RulesetData } from "./ruleset.types";
import { getFightingStyleChoiceCount, getFightingStyles } from "./fightingStyleRules";
import { getWeaponMastery, getWeaponMasteryChoiceCount } from "./equipmentRules";
import { getMetamagicChoiceCount, getMetamagicOptions } from "./metamagicRules";
import { getEldritchInvocations, getInvocationChoiceCount, isInvocationEligible } from "./invocationRules";

export type ValidationSeverity = "error" | "warning";
export type CharacterValidationIssue = { id: string; severity: ValidationSeverity; step: string; message: string };

export function validateCharacterDraft(draft: CharacterDraft, rulesetData: RulesetData | null, finalAbilities: AbilityScores): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = [];
  const add = (id: string, severity: ValidationSeverity, step: string, message: string) => issues.push({ id, severity, step, message });
  const classData = rulesetData?.classes.find((item) => item.name === draft.className) ?? null;
  const background = rulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null;

  if (!draft.name.trim()) add("name", "error", "Basic", "Karakter adı zorunlu.");
  if (draft.level < 1 || draft.level > 20 || !Number.isInteger(draft.level)) add("level", "error", "Class", "Level 1 ile 20 arasında tam sayı olmalı.");
  if (!draft.className.trim() || (draft.ruleset !== "homebrew" && !classData)) add("class", "error", "Class", "Geçerli bir class seçilmeli.");
  if (draft.ruleset !== "homebrew" && !rulesetData?.races.some((item) => item.name === draft.race)) add("race", "error", "Class", "Geçerli bir race/species seçilmeli.");
  if (draft.ruleset !== "homebrew" && !background) add("background", "error", "Class", "Background seçilmeli.");
  if (classData && draft.level >= classData.subclassLevel && !draft.subclass) add("subclass", "error", "Class", `Level ${classData.subclassLevel} itibarıyla subclass seçilmeli.`);

  for (const [ability, score] of Object.entries(finalAbilities)) {
    if (!Number.isInteger(score) || score < 1 || score > 20) add(`ability-${ability}`, "error", "Abilities", `${ability.toUpperCase()} nihai skoru oyuncu karakteri için 1–20 arasında tam sayı olmalı.`);
  }
  if (draft.ruleset === "dnd_2024" && background) {
    if (!draft.originAbilityPrimary || !draft.originAbilitySecondary) add("origin-abilities", "error", "Class", "2024 background için +2 ve +1 ability seçimleri tamamlanmalı.");
    if (draft.originAbilityPrimary === draft.originAbilitySecondary) add("origin-duplicate", "error", "Class", "+2 ve +1 aynı ability üzerine verilemez.");
  }

  if (classData) {
    const selected = normalizeClassSkillChoices(draft.skillProficiencies, classData, background);
    if (selected.length !== classData.skillChoices.choose) add("skills", "error", "Skills", `${classData.name} için ${classData.skillChoices.choose} class skill seçilmeli (${selected.length} seçili).`);
  }

  const featSlots = getGeneralFeatSlotCount(draft.level, draft.className, draft.ruleset);
  if (draft.featIds.length > featSlots) add("feat-count", "error", "Feats", `Feat kotası aşıldı: ${draft.featIds.length}/${featSlots}.`);
  for (const featId of draft.featIds) {
    const feat = rulesetData?.feats.find((item) => item.id === featId);
    if (!feat) add(`feat-${featId}`, "error", "Feats", "Seçilen feat bu ruleset içinde bulunamadı.");
    else if (!isFeatEligible(feat, { level: draft.level, className: draft.className, abilities: finalAbilities, canCastSpells: Boolean(classData?.spellcastingAbility) }).eligible) add(`feat-${featId}`, "error", "Feats", `${feat.name} prerequisite koşullarını karşılamıyor.`);
  }

  const fightingStyleLimit = getFightingStyleChoiceCount(draft.className, draft.level, draft.subclass);
  const fightingStyleIds = draft.fightingStyleIds ?? [];
  const availableStyleIds = new Set(getFightingStyles(draft.ruleset).map((style) => style.id));
  if (fightingStyleIds.length !== fightingStyleLimit || fightingStyleIds.some((id) => !availableStyleIds.has(id))) add("fighting-styles", "error", "Combat", `${draft.className} için ${fightingStyleLimit} geçerli Fighting Style seçilmeli (${fightingStyleIds.length} seçili).`);
  const masteryLimit = getWeaponMasteryChoiceCount(classData, draft.level, draft.ruleset);
  const masteredWeaponIds = draft.masteredWeaponIds ?? [];
  const validMasteryIds = new Set((rulesetData?.items ?? []).filter((item) => getWeaponMastery(item, draft.ruleset)).map((item) => item.id));
  if (masteredWeaponIds.length !== masteryLimit || masteredWeaponIds.some((id) => !validMasteryIds.has(id))) add("weapon-mastery", "error", "Equipment", `${draft.className} için ${masteryLimit} geçerli Weapon Mastery seçilmeli (${masteredWeaponIds.length} seçili).`);
  const metamagicLimit=getMetamagicChoiceCount(draft.className,draft.level,draft.ruleset); const metamagicIds=draft.metamagicIds??[]; const validMetamagicIds=new Set(getMetamagicOptions(draft.ruleset).map(item=>item.id));
  if(metamagicIds.length!==metamagicLimit||metamagicIds.some(id=>!validMetamagicIds.has(id))) add("metamagic","error","Feats",`${draft.className} için ${metamagicLimit} geçerli Metamagic seçilmeli (${metamagicIds.length} seçili).`);
  const invocationLimit=getInvocationChoiceCount(draft.className,draft.level,draft.ruleset); const invocationIds=draft.invocationIds??[]; const invocationMap=new Map(getEldritchInvocations(draft.ruleset).map(item=>[item.id,item]));
  if(invocationIds.length!==invocationLimit||invocationIds.some(id=>{const item=invocationMap.get(id);return !item||!isInvocationEligible(item,draft)})) add("invocations","error","Feats",`${draft.className} için ${invocationLimit} prerequisite uyumlu Eldritch Invocation seçilmeli (${invocationIds.length} seçili).`);

  const highestSpellLevel = getHighestSpellLevel(classData ?? undefined, draft.level);
  for (const spellId of draft.knownSpellIds) {
    const spell = rulesetData?.spells.find((item) => item.id === spellId);
    if (!spell || !isSpellAvailableToClass(spell, draft.className) || (spell.level > 0 && spell.level > highestSpellLevel)) add(`spell-${spellId}`, "error", "Spells", "Seçilen büyülerden biri class veya level ile uyumlu değil.");
  }
  if (draft.preparedSpellIds.some((id) => !draft.knownSpellIds.includes(id))) add("prepared", "error", "Spells", "Prepared büyüler known spell listesinde bulunmalı.");

  const inventoryIds = new Set(draft.inventory.filter((item) => item.quantity > 0).map((item) => item.itemId));
  const equipped = [draft.equippedArmorId, draft.equippedShieldId, ...draft.equippedWeaponIds].filter((id): id is string => Boolean(id));
  if (equipped.some((id) => !inventoryIds.has(id))) add("equipment", "error", "Equipment", "Kuşanılan bütün eşyalar inventory içinde bulunmalı.");
  if (draft.maxHp < 1) add("hp", "error", "Combat", "Max HP en az 1 olmalı.");
  if (draft.gold < 0) add("gold", "error", "Equipment", "Gold negatif olamaz.");
  if (!buildFinalSkillProficiencies(draft.skillProficiencies, classData, background).length) add("no-skills", "warning", "Skills", "Karakterin hiçbir skill proficiency kaydı yok.");
  if (!draft.inventory.length) add("no-equipment", "warning", "Equipment", "Inventory boş; karakter ekipmansız kaydedilecek.");
  return issues;
}

export function hasValidationErrors(issues: CharacterValidationIssue[]) {
  return issues.some((issue) => issue.severity === "error");
}
