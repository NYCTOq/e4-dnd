import{describe,expect,it}from"vitest";import{getDivineClassRuntime}from"./divineClassRuntime";
describe("divine classes mega runtime",()=>{
 it("dnd_2014 certifies Cleric resources",()=>{expect(getDivineClassRuntime("Cleric",18,"dnd_2014")).toMatchObject({channelDivinityUses:3,healingPool:0})});
 it("dnd_2024 certifies Cleric resources",()=>{expect(getDivineClassRuntime("Cleric",18,"dnd_2024")).toMatchObject({channelDivinityUses:4,healingPool:0})});
 it("certifies Paladin healing and aura progression",()=>{expect(getDivineClassRuntime("Paladin",18,"dnd_2014")).toMatchObject({channelDivinityUses:1,healingPool:90,auraRadius:30})});
 it("separates 2014 and 2024 Wild Shape progression",()=>{expect(getDivineClassRuntime("Druid",6,"dnd_2014").wildShapeUses).toBe(2);expect(getDivineClassRuntime("Druid",6,"dnd_2024").wildShapeUses).toBe(3)});
 it("certifies Ranger mark and companion progression",()=>{expect(getDivineClassRuntime("Ranger",13,"dnd_2024",4,"Beast Master")).toMatchObject({favoredEnemyUses:5,markDamage:"1d6",companionAttacks:2})});
});
