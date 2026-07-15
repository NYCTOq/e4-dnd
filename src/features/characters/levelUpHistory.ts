import type { Character } from "../../core/character/character.types";
export type LevelUpHistoryEntry={id:string;characterId:string;fromLevel:number;toLevel:number;createdAt:string;before:Character};
const KEY="e4_dnd_level_up_history_v2";
export function loadLevelUpHistory():LevelUpHistoryEntry[]{try{const value:unknown=JSON.parse(localStorage.getItem(KEY)??"[]");return Array.isArray(value)?value.slice(0,20) as LevelUpHistoryEntry[]:[];}catch{return [];}}
export function saveLevelUpSnapshot(character:Character){const entry:LevelUpHistoryEntry={id:crypto.randomUUID(),characterId:character.id,fromLevel:character.level,toLevel:Math.min(20,character.level+1),createdAt:new Date().toISOString(),before:structuredClone(character)}; const next=[entry,...loadLevelUpHistory()].slice(0,20);localStorage.setItem(KEY,JSON.stringify(next));return entry;}
export function getLatestLevelUp(characterId:string){return loadLevelUpHistory().find(item=>item.characterId===characterId)??null;}
export function removeLevelUpHistoryEntry(id:string){localStorage.setItem(KEY,JSON.stringify(loadLevelUpHistory().filter(item=>item.id!==id)));}
