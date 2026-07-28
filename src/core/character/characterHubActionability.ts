import type { Character } from "./character.types";

export type CharacterHubSurface = "dashboard" | "characters" | "detail";
export type CharacterHubActionId = "create" | "recover" | "level-up" | "continue-play" | "open-sheet";
export type CharacterHubState = "empty" | "critical" | "wounded" | "level-ready" | "active-play" | "ready";

export type CharacterHubInput = {
  characterId: string | null;
  currentHp: number;
  maxHp: number;
  level: number;
  pendingLevel: boolean;
  activePlay: boolean;
};

export type CharacterHubDecision = {
  state: CharacterHubState;
  actionId: CharacterHubActionId;
  label: string;
  route: string;
  rank: number;
  reason: string;
};

export function getCanonicalCharacterHubDecision(input: CharacterHubInput): CharacterHubDecision {
  if (!input.characterId) return {state:"empty",actionId:"create",label:"Karakter Oluştur",route:"/builder",rank:0,reason:"Henüz devam edilecek karakter yok."};
  const id=input.characterId;
  if (input.currentHp<=0) return {state:"critical",actionId:"recover",label:"Karakteri Kurtar",route:`/play-mode?character=${id}`,rank:1,reason:"Karakter 0 HP veya ölüm durumunda."};
  if (input.activePlay) return {state:"active-play",actionId:"continue-play",label:"Oyuna Devam Et",route:`/play-mode?character=${id}`,rank:2,reason:"Karakter için aktif masa oturumu var."};
  if (input.pendingLevel) return {state:"level-ready",actionId:"level-up",label:"Seviye Atla",route:`/characters/${id}`,rank:3,reason:"Karakter için bekleyen level-up işlemi var."};
  if (input.currentHp<input.maxHp) return {state:"wounded",actionId:"recover",label:"Oyuna Dön",route:`/play-mode?character=${id}`,rank:4,reason:"Karakter hasarlı; Play Mode ve Rest akışı en yakın eylem."};
  return {state:"ready",actionId:"open-sheet",label:"Karakteri Aç",route:`/characters/${id}`,rank:5,reason:"Karakter hazır ve kritik bekleyen işlem yok."};
}

export function projectCharacterHubDecision(surface: CharacterHubSurface,input:CharacterHubInput): CharacterHubDecision {
  const canonical=getCanonicalCharacterHubDecision(input);
  return {...canonical,reason:`${surface}: ${canonical.reason}`};
}

export function getCharacterHubInput(character: Character | null | undefined, context: Partial<Pick<CharacterHubInput,"pendingLevel"|"activePlay">> = {}): CharacterHubInput {
  return character ? {
    characterId: character.id,
    currentHp: character.currentHp ?? character.maxHp ?? 0,
    maxHp: character.maxHp ?? 0,
    level: character.level ?? 1,
    pendingLevel: context.pendingLevel ?? false,
    activePlay: context.activePlay ?? false,
  } : {characterId:null,currentHp:0,maxHp:0,level:0,pendingLevel:false,activePlay:false};
}
