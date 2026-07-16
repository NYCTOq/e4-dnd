import { describe, expect, it } from "vitest";
import { ITEM_EXPANSION_2014 } from "./itemExpansion";
import { getAttunedItemCount, recoverItemCharges, spendItemCharge, toggleItemAttunement } from "./magicItemRules";

describe("magic item runtime", () => {
  const ring = ITEM_EXPANSION_2014.find((item) => item.id === "ring-of-protection")!;
  const wand = ITEM_EXPANSION_2014.find((item) => item.id === "wand-of-magic-missiles")!;
  it("attunes owned items and enforces the three item limit", () => { const inv=["a","b","c"].map((itemId)=>({itemId,quantity:1,attuned:true})); expect(toggleItemAttunement([...inv,{itemId:ring.id,quantity:1}],ring).at(-1)?.attuned).toBeUndefined(); expect(getAttunedItemCount(inv)).toBe(3); });
  it("spends charges without exceeding item capacity", () => { const next=spendItemCharge([{itemId:wand.id,quantity:1}],wand,20); expect(next[0].chargesUsed).toBe(7); });
  it("recovers daily item charges", () => { const next=recoverItemCharges([{itemId:wand.id,quantity:1,chargesUsed:6}],ITEM_EXPANSION_2014); expect(next[0].chargesUsed).toBe(0); });
});
