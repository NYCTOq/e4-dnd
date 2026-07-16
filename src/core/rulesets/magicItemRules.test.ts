import { describe, expect, it } from "vitest";
import { ITEM_EXPANSION_2014 } from "./itemExpansion";
import { getAttunedItemCount, getAttunedMagicItemBonuses, getChargeRecoveryAmount, recoverItemCharges, spendItemCharge, toggleItemAttunement } from "./magicItemRules";

describe("magic item runtime", () => {
  const ring = ITEM_EXPANSION_2014.find((item) => item.id === "ring-of-protection")!;
  const wand = ITEM_EXPANSION_2014.find((item) => item.id === "wand-of-magic-missiles")!;
  it("attunes owned items and enforces the three item limit", () => { const inv=["a","b","c"].map((itemId)=>({itemId,quantity:1,attuned:true})); expect(toggleItemAttunement([...inv,{itemId:ring.id,quantity:1}],ring).at(-1)?.attuned).toBeUndefined(); expect(getAttunedItemCount(inv)).toBe(3); });
  it("spends charges without exceeding item capacity", () => { const next=spendItemCharge([{itemId:wand.id,quantity:1}],wand,20); expect(next[0].chargesUsed).toBe(7); });
  it("rolls daily recovery without exceeding the item maximum", () => { const next=recoverItemCharges([{itemId:wand.id,quantity:1,chargesUsed:6}],ITEM_EXPANSION_2014,()=>0); expect(next[0].chargesUsed).toBe(4); expect(getChargeRecoveryAmount("1d6+1 daily",7,()=>0.999)).toBe(7); });
  it("applies bonuses only while the item is attuned", () => { expect(getAttunedMagicItemBonuses([{itemId:ring.id,quantity:1,attuned:true}],ITEM_EXPANSION_2014)).toEqual({armorClass:1,savingThrows:1}); });
  it("stores charge cost and spell linkage for casting items", () => { expect(wand).toMatchObject({grantedSpellName:"Magic Missile",chargeCost:1,charges:7}); });
  it("fully restores items whose recovery is simply daily", () => { expect(getChargeRecoveryAmount("daily",3,()=>0)).toBe(3); });
});
