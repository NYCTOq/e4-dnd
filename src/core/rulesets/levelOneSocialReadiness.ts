import type { CharacterDraft } from "../character/character.types";
import type { DndSpellData, RulesetData } from "./ruleset.types";

export type LevelOneSocialReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

const SOCIAL_SKILLS = new Set(["deception", "insight", "intimidation", "performance", "persuasion"]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isSocialSpell(spell: DndSpellData) {
  return spell.tags?.some((tag) => ["social", "communication", "charm", "language"].includes(normalize(tag)))
    || /charm|communicat|language|thought|friend|suggestion|disguise/i.test(`${spell.name} ${spell.description}`);
}

export function getLevelOneSocialReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneSocialReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden kimlik ve sosyal profil doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const nameValid = draft.name.trim().length > 0;
  checks.push(nameValid);
  if (!nameValid) blockers.push("Karakter adı girilmeli.");
  else summary.push(`Karakter ${draft.name.trim()}`);

  const classValid = rulesetData.classes.some((entry) => entry.name === draft.className);
  const raceValid = rulesetData.races.some((entry) => entry.name === draft.race);
  const background = rulesetData.backgrounds.find((entry) => entry.name === draft.background) ?? null;
  checks.push(classValid, raceValid, Boolean(background));
  if (!classValid) blockers.push("Geçerli bir Class seçilmeli.");
  if (!raceValid) blockers.push("Geçerli bir Race/Species seçilmeli.");
  if (!background) blockers.push("Geçerli bir Background seçilmeli.");
  if (background) summary.push(`Background ${background.name}`);

  const socialSkills = [...new Set(draft.skillProficiencies.map(normalize).filter((skill) => SOCIAL_SKILLS.has(skill)))];
  const languages = [...new Set(draft.languages.map((language) => language.trim()).filter(Boolean))];
  if (socialSkills.length) summary.push(`Social skills ${socialSkills.length}`);
  if (languages.length) summary.push(`Languages ${languages.length}`);

  const selectedSpellIds = [...new Set([...(draft.knownSpellIds ?? []), ...(draft.preparedSpellIds ?? []), ...alwaysPreparedSpellIds])];
  const selectedSpells = selectedSpellIds
    .map((id) => rulesetData.spells.find((spell) => spell.id === id))
    .filter((spell): spell is DndSpellData => Boolean(spell));
  const spellReferencesValid = selectedSpells.length === selectedSpellIds.length;
  checks.push(spellReferencesValid);
  if (!spellReferencesValid) blockers.push("Sosyal profil denetiminde katalogda bulunmayan spell referansı var.");

  const socialSpells = selectedSpells.filter(isSocialSpell);
  if (socialSpells.length) summary.push(`Social magic ${socialSpells.slice(0, 3).map((spell) => spell.name).join(", ")}`);

  if (!draft.playerName.trim()) notices.push("Oyuncu adı boş; masa ve export kayıtlarında karakter sahibini ayırmak zorlaşabilir.");
  if (draft.notes.trim().length < 20) notices.push("Kısa bir kişilik, amaç veya bağ notu eklemek karakteri masada ayırt etmeyi kolaylaştırır.");

  const hasSocialTool = socialSkills.length > 0 || languages.length > 1 || socialSpells.length > 0;
  checks.push(hasSocialTool);
  if (!hasSocialTool) notices.push("Karakterde görünür bir sosyal skill, ek language veya sosyal büyü seçeneği yok.");

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
