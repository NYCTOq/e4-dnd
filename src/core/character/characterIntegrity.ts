import type { Character } from "./character.types";
import type { RulesetData } from "../rulesets/ruleset.types";
import { getCharacterChoiceDebt } from "../rulesets/choiceDebt";
import { getGeneralFeatSlotCount, isFeatEligible } from "../rulesets/featRules";
import { normalizeClassLevels } from "../rulesets/multiclassRules";
import { isSpellAvailableToClass } from "../rulesets/spellRules";

export type IntegritySection = "identity" | "abilities" | "class" | "skills" | "spells" | "equipment" | "combat";
export type CharacterIntegrityIssue = { id: string; severity: "error" | "warning"; section: IntegritySection; message: string };
export type CharacterIntegrityReport = { status: "ready" | "needs-attention"; score: number; errors: number; warnings: number; issues: CharacterIntegrityIssue[] };

const unique = (values: string[]) => new Set(values).size === values.length;

export function auditCharacterIntegrity(character: Character, rulesetData: RulesetData | null): CharacterIntegrityReport {
  const issues: CharacterIntegrityIssue[] = [];
  const add = (id: string, severity: CharacterIntegrityIssue["severity"], section: IntegritySection, message: string) => issues.push({ id, severity, section, message });
  const classLevels = normalizeClassLevels(character.classLevels, character.className, character.level);

  if (!character.name.trim() || !character.className.trim() || !character.race.trim() || !character.background.trim()) add("identity", "error", "identity", "İsim, class, race/species ve background bilgilerini tamamla.");
  if (!Number.isInteger(character.level) || character.level < 1 || character.level > 20) add("level", "error", "class", "Level 1–20 arasında olmalı.");
  if (classLevels.reduce((sum, item) => sum + item.level, 0) !== character.level || classLevels.some((item) => item.level < 1 || item.level > 20)) add("multiclass-levels", "error", "class", "Class level toplamı karakter level ile eşleşmiyor.");
  if (Object.values(character.abilities).some((score) => !Number.isInteger(score) || score < 1 || score > 30)) add("abilities", "error", "abilities", "Ability skorlarından biri 1–30 aralığının dışında.");
  if (!unique(character.skillProficiencies) || !unique(character.expertiseSkills) || character.expertiseSkills.some((skill) => !character.skillProficiencies.includes(skill))) add("skills", "error", "skills", "Skill/expertise seçimlerinde tekrar veya proficiency dışı expertise var.");
  if (character.maxHp < 1 || character.currentHp < 0 || character.currentHp > character.maxHp || character.tempHp < 0) add("hp", "error", "combat", "HP değerlerini geçerli aralığa getir.");
  if (!Number.isInteger(character.exhaustion) || character.exhaustion < 0 || character.exhaustion > 6) add("exhaustion", "error", "combat", "Exhaustion 0–6 arasında olmalı.");
  if ([character.deathSaves.successes, character.deathSaves.failures].some((value) => !Number.isInteger(value) || value < 0 || value > 3)) add("death-saves", "error", "combat", "Death save sayaçları 0–3 arasında olmalı.");
  if ([...character.spellSlots, ...(character.pactMagicSlots ?? [])].some((slot) => slot.level < 1 || slot.level > 9 || slot.max < 0 || slot.used < 0 || slot.used > slot.max)) add("spell-slots", "error", "spells", "Spell slot kullanım değerlerinden biri geçersiz.");
  if (character.preparedSpellIds.some((id) => !character.knownSpellIds.includes(id)) || !unique(character.knownSpellIds) || !unique(character.preparedSpellIds)) add("spells", "error", "spells", "Known/prepared spell listelerinde tekrar veya bilinmeyen prepared spell var.");

  const inventoryIds = new Set(character.inventory.filter((item) => item.quantity > 0).map((item) => item.itemId));
  const equippedIds = [character.equippedArmorId, character.equippedShieldId, ...character.equippedWeaponIds].filter((id): id is string => Boolean(id));
  if (character.inventory.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1) || !unique(character.inventory.map((item) => item.itemId))) add("inventory-shape", "error", "equipment", "Inventory miktarlarında veya eşya kayıtlarında hata var.");
  if (equippedIds.some((id) => !inventoryIds.has(id)) || !unique(equippedIds)) add("equipment", "error", "equipment", "Kuşanılan eşyalardan biri inventory içinde değil veya iki kez kuşanılmış.");
  if (character.inventory.filter((item) => item.attuned).length > 3) add("attunement", "error", "equipment", "Aynı anda en fazla 3 magic item attune edilebilir.");

  if (rulesetData) {
    const classes = new Map(rulesetData.classes.map((item) => [item.name, item]));
    const primaryClass = classes.get(character.className);
    if (character.ruleset !== "homebrew" && (!primaryClass || !rulesetData.races.some((item) => item.name === character.race) || !rulesetData.backgrounds.some((item) => item.name === character.background))) add("ruleset", "error", "identity", "Karakter seçimlerinden biri aktif ruleset verisiyle eşleşmiyor.");
    if (character.ruleset !== "homebrew" && classLevels.some((entry) => !classes.has(entry.className))) add("multiclass-ruleset", "error", "class", "Multiclass seçimlerinden biri aktif ruleset içinde yok.");
    if (primaryClass && character.level >= primaryClass.subclassLevel && !rulesetData.subclasses.some((item) => item.className === character.className && item.name === character.subclass)) add("subclass", "error", "class", "Geçerli bir subclass seçimi gerekli.");

    const featLimit = getGeneralFeatSlotCount(character.level, character.className, character.ruleset);
    if (!unique(character.featIds) || character.featIds.length > featLimit) add("feat-count", "error", "class", `Feat seçimleri kotayı aşıyor veya tekrar içeriyor (${character.featIds.length}/${featLimit}).`);
    for (const featId of character.featIds) {
      const feat = rulesetData.feats.find((item) => item.id === featId);
      if (!feat || !isFeatEligible(feat, { level: character.level, className: character.className, abilities: character.abilities, canCastSpells: Boolean(primaryClass?.spellcastingAbility) }).eligible) add(`feat-${featId}`, "error", "class", "Seçilen feat bulunamadı veya prerequisite koşullarını karşılamıyor.");
    }
    for (const spellId of character.knownSpellIds) {
      const spell = rulesetData.spells.find((item) => item.id === spellId);
      if (!spell || !classLevels.some((entry) => isSpellAvailableToClass(spell, entry.className))) add(`spell-${spellId}`, "error", "spells", "Bilinen büyülerden biri class listesinde veya aktif ruleset içinde değil.");
    }
    if (character.inventory.some((entry) => !rulesetData.items.some((item) => item.id === entry.itemId))) add("inventory-reference", "error", "equipment", "Inventory içinde aktif ruleset'te bulunmayan eşya var.");
  }

  if (!character.skillProficiencies.length) add("skills-empty", "warning", "skills", "Skill proficiency kaydı yok.");
  if (!character.inventory.length) add("inventory-empty", "warning", "equipment", "Inventory boş; ekipman saldırıları görünmez.");
  for (const debt of getCharacterChoiceDebt(character, rulesetData)) add(`choice-${debt.id}`, "error", debt.step === "combat" ? "combat" : debt.step === "equipment" ? "equipment" : debt.step === "spells" ? "spells" : "class", debt.message);

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  const score = Math.max(0, 100 - Math.min(100, errors * 14 + warnings * 3));
  return { status: errors ? "needs-attention" : "ready", score, errors, warnings, issues };
}
