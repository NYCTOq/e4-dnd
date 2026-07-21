import type { CharacterDraft } from "../character/character.types";
import type { CharacterValidationIssue } from "./characterValidation";

export type SingleClassPlayableReadiness = {
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
};

export function getSingleClassPlayableReadiness(
  draft: CharacterDraft,
  validationIssues: CharacterValidationIssue[],
): SingleClassPlayableReadiness {
  const blockers: string[] = [];
  const notices: string[] = [];
  const officialRuleset = draft.ruleset === "dnd_2014" || draft.ruleset === "dnd_2024";
  const validationErrors = validationIssues.filter((issue) => issue.severity === "error");
  const hasStartingResources = draft.inventory.some((entry) => entry.quantity > 0) || draft.gold > 0;
  const hasValidHp = Number.isFinite(draft.maxHp) && draft.maxHp > 0;
  const hasIdentity = Boolean(draft.name.trim() && draft.race.trim() && draft.className.trim());
  const hasAbilities = Object.values(draft.abilities).every((score) => Number.isFinite(score) && score >= 3 && score <= 20);

  if (!officialRuleset) blockers.push("Bu kontrol yalnız 2014/2024 resmî tek-sınıf karakterleri için sertifikalıdır.");
  if (!hasIdentity) blockers.push("Karakter adı, Race/Species ve Class tamamlanmalı.");
  if (!hasValidHp) blockers.push("Max HP en az 1 olmalı.");
  if (!hasAbilities) blockers.push("Altı ability skorunun tamamı 3–20 aralığında olmalı.");
  if (validationErrors.length) blockers.push(`${validationErrors.length} zorunlu Builder hatası çözülmeli.`);
  if (!hasStartingResources) blockers.push("Karakterin en az bir ekipmanı veya başlangıç altını olmalı.");

  if (!draft.inventory.length && draft.gold > 0) notices.push("Ekipman yerine başlangıç altını kullanılıyor; ilk oyun öncesi alışveriş yapılmalı.");
  if (draft.inventory.length && !draft.equippedWeaponIds.length && draft.className !== "Monk") notices.push("Kuşanılmış silah yok; saldırılar için ekipman ekranını kontrol et.");
  if (!draft.notes.trim()) notices.push("Karakter notları boş; bu oynanabilirliği engellemez.");

  const totalChecks = 6;
  const completedChecks = [officialRuleset, hasIdentity, hasValidHp, hasAbilities, validationErrors.length === 0, hasStartingResources].filter(Boolean).length;
  return { ready: blockers.length === 0, blockers, notices, completedChecks, totalChecks };
}
