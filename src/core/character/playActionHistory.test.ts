import { describe, expect, it } from "vitest";
import type { Character } from "./character.types";
import { clearPlayActionSnapshot, getPlayActionStorageKey, readPlayActionSnapshot, savePlayActionSnapshot } from "./playActionHistory";

function memoryStorage() {
  const values = new Map<string,string>();
  return { getItem:(k:string)=>values.get(k)??null, setItem:(k:string,v:string)=>void values.set(k,v), removeItem:(k:string)=>void values.delete(k) };
}

const character = { id:"hero", name:"Hero", currentHp:24, maxHp:42, updatedAt:"2026-07-28T00:00:00.000Z" } as Character;

describe("v5.124 play action history",()=>{
  it("stores a deep snapshot under a character-scoped key",()=>{ const storage=memoryStorage(); const source={...character}; savePlayActionSnapshot(source,"Hasar alındı",storage); source.currentHp=1; expect(readPlayActionSnapshot("hero",storage)?.character.currentHp).toBe(24); expect(getPlayActionStorageKey("hero")).toContain("hero"); });
  it("rejects corrupt and cross-character snapshots",()=>{ const storage=memoryStorage(); storage.setItem(getPlayActionStorageKey("hero"),"not-json"); expect(readPlayActionSnapshot("hero",storage)).toBeNull(); savePlayActionSnapshot(character,"x",storage); expect(readPlayActionSnapshot("other",storage)).toBeNull(); });
  it("clears the undo checkpoint after recovery",()=>{ const storage=memoryStorage(); savePlayActionSnapshot(character,"x",storage); clearPlayActionSnapshot("hero",storage); expect(readPlayActionSnapshot("hero",storage)).toBeNull(); });
});
