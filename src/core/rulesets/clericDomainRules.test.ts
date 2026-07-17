import{describe,expect,it}from"vitest";import{getLifeDomainHealing,getPreserveLifeHealing}from"./clericDomainRules";
describe("Life Domain runtime",()=>{
  it("applies Disciple of Life",()=>{expect(getLifeDomainHealing("Life Domain",1,1)).toMatchObject({healingBonus:3,selfHealing:0});expect(getLifeDomainHealing("Light Domain",20,9).healingBonus).toBe(0)});
  it("unlocks later healing features",()=>{expect(getLifeDomainHealing("Life Domain",6,2)).toMatchObject({selfHealing:4,maximizeHealingDice:false});expect(getLifeDomainHealing("Life Domain",17,9).maximizeHealingDice).toBe(true)});
  it("caps Preserve Life at half HP",()=>{expect(getPreserveLifeHealing(2,1,30)).toBe(10);expect(getPreserveLifeHealing(5,20,30)).toBe(0);expect(getPreserveLifeHealing(5,4,30)).toBe(11)});
});
