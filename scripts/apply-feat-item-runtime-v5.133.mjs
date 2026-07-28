import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const write = (p,c) => { const f=path.join(root,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,c); };
const replaceOnce = (text, from, to, label) => {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  return text.replace(from,to);
};

write('src/core/rulesets/featItemRuntimeCompletion.ts', `import type { CharacterInventoryItem } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import type { FeatAction } from "./advancedFeatRuntimeRules";

export type FeatUseState = { used: number; maximum: number; remaining: number; unlimited: boolean };

export function getFeatUseState(action: FeatAction, uses: Record<string, number>): FeatUseState {
  const unlimited = action.maxUses >= 99;
  const used = unlimited ? 0 : Math.min(action.maxUses, Math.max(0, uses[action.id] ?? 0));
  return { used, maximum: action.maxUses, remaining: unlimited ? action.maxUses : Math.max(0, action.maxUses - used), unlimited };
}

export function spendFeatUse(action: FeatAction, uses: Record<string, number>) {
  const state = getFeatUseState(action, uses);
  if (state.unlimited || state.remaining <= 0) return uses;
  return { ...uses, [action.id]: state.used + 1 };
}

export function recoverFeatUses(rest: "short" | "long", uses: Record<string, number>) {
  return rest === "long" ? {} : uses;
}

export type ItemChargeState = { maximum: number; used: number; remaining: number; ready: boolean; reason: string | null };

export function getItemChargeState(item: DndItemData, entry: CharacterInventoryItem | undefined): ItemChargeState | null {
  if (!item.charges) return null;
  const used = Math.min(item.charges, Math.max(0, entry?.chargesUsed ?? 0));
  const remaining = Math.max(0, item.charges - used);
  const attunementMissing = Boolean(item.requiresAttunement && !entry?.attuned);
  return {
    maximum: item.charges,
    used,
    remaining,
    ready: Boolean(entry && !attunementMissing && remaining >= (item.chargeCost ?? 1)),
    reason: !entry ? "Item envanterde değil." : attunementMissing ? "Önce attunement gerekli." : remaining < (item.chargeCost ?? 1) ? "Yeterli charge yok." : null,
  };
}

export function summarizeRecoveredCharges(before: CharacterInventoryItem[], after: CharacterInventoryItem[], items: readonly DndItemData[]) {
  const names = new Map(items.map((item) => [item.id, item.name]));
  const recovered: string[] = [];
  for (const next of after) {
    const previous = before.find((entry) => entry.itemId === next.itemId);
    const amount = Math.max(0, (previous?.chargesUsed ?? 0) - (next.chargesUsed ?? 0));
    if (amount > 0) recovered.push(\`${'${names.get(next.itemId) ?? next.itemId}'} +${'${amount}'} charge\`);
  }
  return recovered;
}
`);

write('src/core/rulesets/featItemRuntimeCompletion-v5.133.test.ts', `import { describe, expect, it } from "vitest";
import { getFeatUseState, getItemChargeState, recoverFeatUses, spendFeatUse, summarizeRecoveredCharges } from "./featItemRuntimeCompletion";
import type { DndItemData } from "./ruleset.types";

const action = { id: "fey-touched", name: "Fey Touched", type: "bonus-action" as const, maxUses: 1, summary: "Misty Step" };
const item = { id: "wand", name: "Wand", ruleset: "dnd_2014", category: "gear", rarity: "rare", description: "", weight: 1, costGp: 1, charges: 7, chargeCost: 1, requiresAttunement: true } as DndItemData;

describe("v5.133 feat and item runtime completion", () => {
  it("tracks and spends limited feat uses", () => {
    expect(getFeatUseState(action, {}).remaining).toBe(1);
    expect(spendFeatUse(action, {})[action.id]).toBe(1);
  });
  it("recovers limited feat actions only on long rest", () => {
    expect(recoverFeatUses("short", { [action.id]: 1 })).toEqual({ [action.id]: 1 });
    expect(recoverFeatUses("long", { [action.id]: 1 })).toEqual({});
  });
  it("explains attunement and charge blockers", () => {
    expect(getItemChargeState(item, { itemId: item.id, quantity: 1 })?.reason).toContain("attunement");
    expect(getItemChargeState(item, { itemId: item.id, quantity: 1, attuned: true, chargesUsed: 7 })?.remaining).toBe(0);
  });
  it("summarizes recovered magic item charges", () => {
    expect(summarizeRecoveredCharges([{ itemId: item.id, quantity: 1, chargesUsed: 5 }], [{ itemId: item.id, quantity: 1, chargesUsed: 2 }], [item])).toEqual(["Wand +3 charge"]);
  });
});
`);

let play = read('src/features/play-mode/PlayMode.tsx');
play = replaceOnce(play,
'import { getAdvancedFeatRuntime, getInspiringLeaderTempHp, type FeatAction } from "../../core/rulesets/advancedFeatRuntimeRules";',
'import { getAdvancedFeatRuntime, getInspiringLeaderTempHp, type FeatAction } from "../../core/rulesets/advancedFeatRuntimeRules";\nimport { getFeatUseState, getItemChargeState, recoverFeatUses, spendFeatUse, summarizeRecoveredCharges } from "../../core/rulesets/featItemRuntimeCompletion";',
'feat/item import');

play = replaceOnce(play,
'  function spendMagicItemCharge(itemId:string){const item=rulesetData?.items.find(candidate=>candidate.id===itemId);if(!item)return;const cost=item.chargeCost??1;const entry=activeCharacter.inventory.find(candidate=>candidate.itemId===itemId);if(!entry||item.requiresAttunement&&!entry.attuned||!item.charges||item.charges-(entry.chargesUsed??0)<cost)return;if(item.id==="pearl-of-power"){const nextSlots=recoverHighestSpentSpellSlot(spellSlots);if(nextSlots===spellSlots)return;commit({inventory:spendItemCharge(activeCharacter.inventory,item,cost),spellSlots:nextSlots});return}commit({inventory:spendItemCharge(activeCharacter.inventory,item,cost)});const spell=rulesetData?.spells.find(candidate=>candidate.name===item.grantedSpellName);if(spell)castSpell(spell.id,spell.level,false)}',
'  function spendMagicItemCharge(itemId:string){const item=rulesetData?.items.find(candidate=>candidate.id===itemId);if(!item)return;const cost=item.chargeCost??1;const entry=activeCharacter.inventory.find(candidate=>candidate.itemId===itemId);const state=getItemChargeState(item,entry);if(!state?.ready){setActionFeedback(state?.reason??`${item.name} charge ile kullanılamıyor.`);return}const nextInventory=spendItemCharge(activeCharacter.inventory,item,cost);if(item.id==="pearl-of-power"){const nextSlots=recoverHighestSpentSpellSlot(spellSlots);if(nextSlots===spellSlots){setActionFeedback("Pearl of Power için harcanmış 1-3. seviye slot yok.");return}commit({inventory:nextInventory,spellSlots:nextSlots});setActionFeedback(`${item.name} kullanıldı · ${state.remaining-cost}/${state.maximum} charge kaldı.`);return}commit({inventory:nextInventory});setActionFeedback(`${item.name} kullanıldı · ${state.remaining-cost}/${state.maximum} charge kaldı.`);const spell=rulesetData?.spells.find(candidate=>candidate.name===item.grantedSpellName);if(spell)castSpell(spell.id,spell.level,false)}',
'charge handler');

play = replaceOnce(play,
'  function handleFeatAction(action:FeatAction){const used=featActionUses[action.id]??0;if(used>=action.maxUses)return;if(action.type==="action"&&turnEconomy.actionUsed||action.type==="bonus-action"&&turnEconomy.bonusActionUsed||action.type==="reaction"&&turnEconomy.reactionUsed)return;const tempHp=action.id==="inspiring-leader"?getInspiringLeaderTempHp(activeCharacter.level,getAbilityModifier(effectiveCharacter.abilities.cha)):activeCharacter.tempHp;if(action.maxUses<99)setFeatActionUses(current=>({...current,[action.id]:used+1}));commit({tempHp:Math.max(activeCharacter.tempHp,tempHp)});setTurnEconomy(current=>spendTurnResource(current,action.type));setRollHistory(current=>[{id:crypto.randomUUID(),label:`Feat · ${action.name}`,notation:action.summary,total:action.id==="inspiring-leader"?tempHp:0},...current].slice(0,6))}',
'  function handleFeatAction(action:FeatAction){const state=getFeatUseState(action,featActionUses);if(!state.unlimited&&state.remaining<=0){setActionFeedback(`${action.name} için kullanım hakkı kalmadı.`);return}if(action.type==="action"&&turnEconomy.actionUsed||action.type==="bonus-action"&&turnEconomy.bonusActionUsed||action.type==="reaction"&&turnEconomy.reactionUsed){setActionFeedback(`${action.name} için ${action.type} ekonomisi zaten kullanıldı.`);return}const tempHp=action.id==="inspiring-leader"?getInspiringLeaderTempHp(activeCharacter.level,getAbilityModifier(effectiveCharacter.abilities.cha)):activeCharacter.tempHp;setFeatActionUses(current=>spendFeatUse(action,current));commit({tempHp:Math.max(activeCharacter.tempHp,tempHp)});setTurnEconomy(current=>spendTurnResource(current,action.type));setActionFeedback(`${action.name} kullanıldı${state.unlimited?"":` · ${state.remaining-1}/${state.maximum} kullanım kaldı`}.`);setRollHistory(current=>[{id:crypto.randomUUID(),label:`Feat · ${action.name}`,notation:action.summary,total:action.id==="inspiring-leader"?tempHp:0},...current].slice(0,6))}',
'feat handler');

play = replaceOnce(play,
'      inventory: recoverItemCharges(activeCharacter.inventory, rulesetData?.items ?? []),\n    });\n    setLuckyUsed(0);',
'      inventory: recoverItemCharges(activeCharacter.inventory, rulesetData?.items ?? []),\n    });\n    const recoveredInventory=recoverItemCharges(activeCharacter.inventory,rulesetData?.items??[]);\n    const recoveredChargeSummary=summarizeRecoveredCharges(activeCharacter.inventory,recoveredInventory,rulesetData?.items??[]);\n    setFeatActionUses(current=>recoverFeatUses("long",current));\n    setActionFeedback(["Long Rest tamamlandı; sınırlı feat kullanımları yenilendi.",...recoveredChargeSummary].join(" · "));\n    setLuckyUsed(0);',
'long rest recovery');

play = replaceOnce(play,
'{advancedFeatRuntime.actions.map(action=>{const used=featActionUses[action.id]??0;return <button type="button" key={action.id} disabled={used>=action.maxUses||(action.type==="action"&&turnEconomy.actionUsed)||(action.type==="bonus-action"&&turnEconomy.bonusActionUsed)||(action.type==="reaction"&&turnEconomy.reactionUsed)} onClick={()=>handleFeatAction(action)}>{action.name} · {action.type}</button>})}',
'{advancedFeatRuntime.actions.map(action=>{const state=getFeatUseState(action,featActionUses);return <button type="button" key={action.id} disabled={!state.unlimited&&state.remaining<=0||(action.type==="action"&&turnEconomy.actionUsed)||(action.type==="bonus-action"&&turnEconomy.bonusActionUsed)||(action.type==="reaction"&&turnEconomy.reactionUsed)} onClick={()=>handleFeatAction(action)}>{action.name} · {action.type}{state.unlimited?"":` · ${state.remaining}/${state.maximum}`}</button>})}',
'feat action labels');

play = replaceOnce(play,
'{magicItems.map(({entry,item})=><div className="play-mode-slot-row" key={item.id}><div><span>{item.name} · {item.rarity}</span><small>{item.charges?`${item.charges-(entry.chargesUsed??0)} / ${item.charges} charge`:item.requiresAttunement?(entry.attuned?"Attuned":"Attunement gerekli"):"Attunement gerektirmez"}</small></div><div>{item.requiresAttunement?<button type="button" onClick={()=>toggleAttunement(item.id)}>{entry.attuned?"Bağı Kes":"Attune"}</button>:null}{item.charges?<button type="button" disabled={(entry.chargesUsed??0)>=item.charges||Boolean(item.requiresAttunement&&!entry.attuned)} onClick={()=>spendMagicItemCharge(item.id)}>1 Charge</button>:null}</div></div>)}',
'{magicItems.map(({entry,item})=>{const chargeState=getItemChargeState(item,entry);return <div className="play-mode-slot-row" key={item.id}><div><span>{item.name} · {item.rarity}</span><small>{chargeState?`${chargeState.remaining} / ${chargeState.maximum} charge${chargeState.reason?` · ${chargeState.reason}`:""}`:item.requiresAttunement?(entry.attuned?"Attuned":"Attunement gerekli"):"Attunement gerektirmez"}</small></div><div>{item.requiresAttunement?<button type="button" onClick={()=>toggleAttunement(item.id)}>{entry.attuned?"Bağı Kes":"Attune"}</button>:null}{chargeState?<button type="button" disabled={!chargeState.ready} title={chargeState.reason??undefined} onClick={()=>spendMagicItemCharge(item.id)}>{item.chargeCost??1} Charge</button>:null}</div></div>})}',
'magic item ui');
write('src/features/play-mode/PlayMode.tsx', play);

let pkg = JSON.parse(read('package.json'));
pkg.version = '5.133.0';
pkg.scripts = pkg.scripts ?? {};
pkg.scripts['test:feat-item-runtime-completion'] = 'vitest run src/core/rulesets/featItemRuntimeCompletion-v5.133.test.ts';
pkg.scripts['certify:feat-item-runtime-completion'] = 'npm run test:feat-item-runtime-completion && npm run build';
write('package.json', JSON.stringify(pkg,null,2)+'\n');
console.log('v5.133 files applied.');
