import type { CharacterDraft, RulesetId } from "../character/character.types";

export type EldritchInvocation = {
  id: string;
  name: string;
  minimumLevel?: number;
  requiredSpellId?: string;
  summary: string;
};

const invocations: EldritchInvocation[] = [
  { id: "agonizing-blast", name: "Agonizing Blast", requiredSpellId: "eldritch-blast", summary: "Eldritch Blast hasarına Charisma modifier desteği ekler." },
  { id: "armor-of-shadows", name: "Armor of Shadows", summary: "Mage Armor etkisini spell slot harcamadan kullanabilmeni sağlar." },
  { id: "beast-speech", name: "Beast Speech", summary: "Hayvanlarla konuşma büyüsünü kaynak harcamadan kullanırsın." },
  { id: "beguiling-influence", name: "Beguiling Influence", summary: "Deception ve Persuasion alanlarında eğitim kazandırır." },
  { id: "devils-sight", name: "Devil's Sight", summary: "Karanlıkta, büyülü karanlık dahil, olağanüstü görüş sağlar." },
  { id: "eldritch-sight", name: "Eldritch Sight", summary: "Detect Magic etkisini kaynak harcamadan kullanırsın." },
  { id: "eldritch-spear", name: "Eldritch Spear", requiredSpellId: "eldritch-blast", summary: "Eldritch Blast menzilini belirgin biçimde artırır." },
  { id: "eyes-of-the-rune-keeper", name: "Eyes of the Rune Keeper", summary: "Yazılı dilleri anlamanı sağlayan mistik bir kavrayış verir." },
  { id: "fiendish-vigor", name: "Fiendish Vigor", summary: "Kendine geçici Hit Point sağlayan savunma büyüsünü serbestçe kullanırsın." },
  { id: "gaze-of-two-minds", name: "Gaze of Two Minds", summary: "İstekli bir canlının duyularından yararlanabilirsin." },
  { id: "mask-of-many-faces", name: "Mask of Many Faces", summary: "Disguise Self etkisini spell slot harcamadan kullanırsın." },
  { id: "misty-visions", name: "Misty Visions", summary: "Silent Image etkisini kaynak harcamadan oluşturursun." },
  { id: "one-with-shadows", name: "One with Shadows", minimumLevel: 5, summary: "Loş ışıkta veya karanlıkta hareketsizken görünmez olabilirsin." },
  { id: "repelling-blast", name: "Repelling Blast", requiredSpellId: "eldritch-blast", summary: "Eldritch Blast isabeti hedefi senden uzağa itebilir." },
  { id: "ascendant-step", name: "Ascendant Step", minimumLevel: 9, summary: "Levitate etkisini kendi üzerinde kaynak harcamadan kullanırsın." },
  { id: "otherworldly-leap", name: "Otherworldly Leap", minimumLevel: 9, summary: "Jump etkisini kendi üzerinde kaynak harcamadan kullanırsın." },
  { id: "whispers-of-the-grave", name: "Whispers of the Grave", minimumLevel: 9, summary: "Ölülerle konuşma büyüsünü kaynak harcamadan kullanırsın." },
  { id: "master-of-myriad-forms", name: "Master of Myriad Forms", minimumLevel: 15, summary: "Alter Self etkisini spell slot harcamadan kullanırsın." },
  { id: "visions-of-distant-realms", name: "Visions of Distant Realms", minimumLevel: 15, summary: "Arcane Eye etkisini kaynak harcamadan kullanırsın." },
  { id: "witch-sight", name: "Witch Sight", minimumLevel: 15, summary: "Yakınındaki şekil değiştiren veya illüzyonla gizlenen varlıkların gerçek biçimini görürsün." },
];

export function getEldritchInvocations(_ruleset: RulesetId) { return invocations; }

export function getInvocationChoiceCount(className: string, level: number, ruleset: RulesetId) {
  if (className.trim().toLowerCase() !== "warlock") return 0;
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level)));
  if (ruleset === "dnd_2024") {
    if (safeLevel >= 18) return 10;
    if (safeLevel >= 15) return 9;
    if (safeLevel >= 12) return 8;
    if (safeLevel >= 9) return 7;
    if (safeLevel >= 7) return 6;
    if (safeLevel >= 5) return 5;
    return safeLevel >= 2 ? 3 : 1;
  }
  if (safeLevel < 2) return 0;
  if (safeLevel >= 18) return 8;
  if (safeLevel >= 15) return 7;
  if (safeLevel >= 12) return 6;
  if (safeLevel >= 9) return 5;
  if (safeLevel >= 7) return 4;
  return safeLevel >= 5 ? 3 : 2;
}

export function isInvocationEligible(invocation: EldritchInvocation, draft: Pick<CharacterDraft, "level" | "knownSpellIds"> & Partial<Pick<CharacterDraft, "ruleset">>) {
  if ((invocation.minimumLevel ?? 1) > draft.level) return false;
  if (!invocation.requiredSpellId) return true;
  const editionId = draft.ruleset === "dnd_2024" ? `${invocation.requiredSpellId}-2024` : invocation.requiredSpellId;
  return draft.knownSpellIds.includes(editionId);
}
