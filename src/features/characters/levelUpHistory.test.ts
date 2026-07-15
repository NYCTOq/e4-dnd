import {beforeEach,describe,expect,it,vi} from "vitest";
import {makeCharacter} from "../../test/fixtures";
import {getLatestLevelUp,loadLevelUpHistory,removeLevelUpHistoryEntry,saveLevelUpSnapshot} from "./levelUpHistory";
const store=new Map<string,string>();
beforeEach(()=>{store.clear();vi.stubGlobal("localStorage",{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});vi.stubGlobal("crypto",{randomUUID:()=>"history-1"});vi.stubGlobal("structuredClone",(value:unknown)=>JSON.parse(JSON.stringify(value)));});
describe("level up history",()=>{
 it("stores a rollback snapshot",()=>{saveLevelUpSnapshot(makeCharacter({level:5}));expect(loadLevelUpHistory()[0]).toMatchObject({fromLevel:5,toLevel:6});});
 it("returns latest history per character",()=>{const c=makeCharacter({id:"hero"});saveLevelUpSnapshot(c);expect(getLatestLevelUp("hero")?.before.id).toBe("hero");});
 it("removes an undone entry",()=>{saveLevelUpSnapshot(makeCharacter());removeLevelUpHistoryEntry("history-1");expect(loadLevelUpHistory()).toHaveLength(0);});
});
