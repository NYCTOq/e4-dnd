import type { Character } from "./character.types";
import type { RulesetData } from "../rulesets/ruleset.types";
import { getCharacterChoiceDebt } from "../rulesets/choiceDebt";
import { normalizeClassLevels } from "../rulesets/multiclassRules";

export type PlayReadinessIssue = { id: string; severity: "error" | "warning"; message: string };
export type PlayReadiness = { status: "ready" | "needs-attention"; score: number; issues: PlayReadinessIssue[] };

export function getPlayReadiness(character: Character, rulesetData: RulesetData | null): PlayReadiness {
  const issues: PlayReadinessIssue[] = [];
  const add = (id: string, severity: PlayReadinessIssue["severity"], message: string) => issues.push({ id, severity, message });

  if (!character.name.trim() || !character.className.trim() || !character.race.trim() || !character.background.trim()) {
    add("identity", "error", "İsim, class, race/species ve background bilgilerini tamamla.");
  }
  if (!Number.isInteger(character.level) || character.level < 1 || character.level > 20) add("level", "error", "Level 1–20 arasında olmalı.");
  const classLevels=normalizeClassLevels(character.classLevels,character.className,character.level);
  if(classLevels.reduce((sum,item)=>sum+item.level,0)!==character.level)add("multiclass-levels","error","Class level toplamı karakter level ile eşleşmiyor.");
  if (Object.values(character.abilities).some((score) => !Number.isInteger(score) || score < 1 || score > 30)) add("abilities", "error", "Ability skorlarından biri geçersiz.");
  if (character.maxHp < 1 || character.currentHp < 0 || character.currentHp > character.maxHp) add("hp", "error", "HP değerlerini geçerli aralığa getir.");

  const inventoryIds = new Set(character.inventory.filter((item) => item.quantity > 0).map((item) => item.itemId));
  const equippedIds = [character.equippedArmorId, character.equippedShieldId, ...character.equippedWeaponIds].filter((id): id is string => Boolean(id));
  if (equippedIds.some((id) => !inventoryIds.has(id))) add("equipment", "error", "Kuşanılan eşyalardan biri inventory içinde değil.");
  if (character.preparedSpellIds.some((id) => !character.knownSpellIds.includes(id))) add("spells", "error", "Prepared listesinde bilinmeyen bir büyü var.");

  if (rulesetData) {
    const classExists = rulesetData.classes.some((item) => item.name === character.className);
    const raceExists = rulesetData.races.some((item) => item.name === character.race);
    const backgroundExists = rulesetData.backgrounds.some((item) => item.name === character.background);
    if (character.ruleset !== "homebrew" && (!classExists || !raceExists || !backgroundExists)) add("ruleset", "error", "Karakter seçimlerinden biri aktif ruleset verisiyle eşleşmiyor.");
    if(character.ruleset!=="homebrew"&&classLevels.some(level=>!rulesetData.classes.some(item=>item.name===level.className)))add("multiclass-ruleset","error","Multiclass seçimlerinden biri aktif ruleset içinde yok.");
  }

  if (!character.skillProficiencies.length) add("skills", "warning", "Skill proficiency kaydı yok; saving throw dışındaki rollar eksik kalabilir.");
  if (!character.inventory.length) add("inventory", "warning", "Inventory boş; ekipman saldırıları Play Mode'da görünmez.");
  for(const debt of getCharacterChoiceDebt(character,rulesetData))add(`choice-${debt.id}`,"error",debt.message);

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const score = Math.max(0, Math.round(((7 - Math.min(7, errorCount)) / 7) * 100));
  return { status: errorCount ? "needs-attention" : "ready", score, issues };
}
