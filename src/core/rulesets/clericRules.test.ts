import{describe,expect,it}from"vitest";
import{getChannelDivinityUses,getClericCantripCount,getClericCombatFeatures,getClericPreparedSpellLimit,getDestroyUndeadCr,getDivineSparkDice}from"./clericRules";
describe("cleric rules",()=>{
 it("keeps Channel Divinity edition-aware",()=>{expect(getChannelDivinityUses(2,"dnd_2014")).toBe(1);expect(getChannelDivinityUses(18,"dnd_2014")).toBe(3);expect(getChannelDivinityUses(2,"dnd_2024")).toBe(2);expect(getChannelDivinityUses(6,"dnd_2024")).toBe(3);expect(getChannelDivinityUses(18,"dnd_2024")).toBe(4)});
 it("scales 2024 Divine Spark correctly",()=>{expect(getDivineSparkDice(2)).toBe(1);expect(getDivineSparkDice(7)).toBe(2);expect(getDivineSparkDice(13)).toBe(3);expect(getDivineSparkDice(18)).toBe(4)});
 it("keeps Destroy Undead and Sear Undead edition-aware",()=>{expect(getDestroyUndeadCr(5)).toBe(.5);expect(getDestroyUndeadCr(17)).toBe(4);expect(getClericCombatFeatures(10,"dnd_2024")).toMatchObject({divineSpark:true,searUndead:true,destroyUndead:null,divineIntervention:true});expect(getClericCombatFeatures(10,"dnd_2014")).toMatchObject({divineSpark:false,searUndead:false,destroyUndead:1,divineIntervention:true})});
 it("matches cantrip and prepared spell progressions",()=>{expect(getClericCantripCount(1)).toBe(3);expect(getClericCantripCount(4)).toBe(4);expect(getClericCantripCount(10)).toBe(5);expect(getClericPreparedSpellLimit(1,"dnd_2024")).toBe(4);expect(getClericPreparedSpellLimit(20,"dnd_2024")).toBe(22);expect(getClericPreparedSpellLimit(5,"dnd_2014",4)).toBe(9)});
});
