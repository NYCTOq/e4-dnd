import { useMemo, useState } from "react";
import type { Character } from "../../core/character/character.types";
import type { DndItemData } from "../../core/rulesets/ruleset.types";
import { getInventoryEconomySnapshot } from "../../core/rulesets/inventoryEconomyRuntime";
import { addInventoryItem, equipInventoryItem, recoverItemCharges, setInventoryQuantity, spendItemCharge, toggleItemAttunement, unequipInventoryItem, useInventoryItem as executeInventoryItem } from "../../core/rulesets/inventoryActionRuntime-N-MEGA8";

export function InventoryEconomyPanel({character,items,onUpdateCharacter}:{character:Character;items:DndItemData[];onUpdateCharacter:(character:Character)=>void}){
 const report=getInventoryEconomySnapshot(character,items);
 const [selectedId,setSelectedId]=useState(items[0]?.id??"");
 const [message,setMessage]=useState("");
 const itemMap=useMemo(()=>new Map(items.map(item=>[item.id,item])),[items]);
 const carried=report.inventory.map(entry=>({entry,item:itemMap.get(entry.itemId)})).filter((row):row is {entry:typeof report.inventory[number];item:DndItemData}=>Boolean(row.item));
 const equippedIds=new Set([character.equippedArmorId,character.equippedShieldId,...character.equippedWeaponIds].filter((id):id is string=>Boolean(id)));
 const apply=(result:ReturnType<typeof addInventoryItem>)=>{if(result.ok){onUpdateCharacter(result.character);setMessage(result.message)}else setMessage(result.reason)};
 return <section className="inventory-economy-panel" data-testid="inventory-economy-panel">
  <div className="play-mode-section-head"><div><span className="mini-label">Inventory Runtime</span><h2>Equipment & Economy</h2></div><strong>{report.ready?"Ready":"Blocked"}</strong></div>
  <div className="inventory-economy-stats"><span><strong>{report.gold}</strong> gp</span><span><strong>{report.weight.toFixed(1)}</strong> / {report.capacity} lb</span><span><strong>{report.attuned}</strong> / 3 attuned</span><span><strong>{report.ammunition}</strong> ammo</span><span><strong>{report.consumables}</strong> consumable</span></div>
  <progress max={Math.max(100,report.loadPercent)} value={report.loadPercent} aria-label="Carrying capacity usage" />
  <div className="character-actions"><select aria-label="Add inventory item" value={selectedId} onChange={event=>setSelectedId(event.target.value)}>{items.map(item=><option key={item.id} value={item.id}>{item.name} • {item.cost}</option>)}</select><button type="button" onClick={()=>apply(addInventoryItem(character,selectedId,1))} disabled={!selectedId}>Çantaya Ekle</button></div>
  {message?<p role="status">{message}</p>:null}
  {carried.length?<div className="inventory-library-grid">{carried.map(({entry,item})=>{const equipped=equippedIds.has(item.id);const chargesLeft=item.charges?Math.max(0,item.charges-(entry.chargesUsed??0)):null;return <article className="inventory-library-card" key={item.id}>
   <div className="library-item-top"><div><span className="mini-label">{item.category}{equipped?" • Equipped":""}{entry.attuned?" • Attuned":""}</span><h3>{item.name}</h3></div><strong>x{entry.quantity}</strong></div>
   <p>{item.damage?`${item.damage} ${item.damageType??""}`:item.description}</p>
   {chargesLeft!==null?<p>Charges: {chargesLeft}/{item.charges}</p>:null}
   <div className="character-actions">
    <button type="button" onClick={()=>apply(setInventoryQuantity(character,item.id,entry.quantity+1))}>+1</button>
    <button type="button" onClick={()=>apply(setInventoryQuantity(character,item.id,entry.quantity-1))}>-1</button>
    {item.category==="weapon"||item.category==="armor"||item.category==="shield"?<button type="button" onClick={()=>apply(equipped?unequipInventoryItem(character,item.id):equipInventoryItem(character,item))}>{equipped?"Çıkar":"Kuşan"}</button>:null}
    {item.requiresAttunement?<button type="button" onClick={()=>apply(toggleItemAttunement(character,item))}>{entry.attuned?"Attunement Kaldır":"Attune"}</button>:null}
    {item.charges?<><button type="button" onClick={()=>apply(spendItemCharge(character,item))}>Charge Harca</button><button type="button" onClick={()=>apply(recoverItemCharges(character,item))}>Charge Yenile</button></>:null}
    {(item.healingFormula||item.effectDurationRounds||item.charges||item.tags?.some(tag=>tag.toLowerCase()==="consumable"))?<button type="button" onClick={()=>apply(executeInventoryItem(character,item))}>Kullan</button>:null}
   </div>
  </article>})}</div>:<p>Envanter boş. Maceraya yumrukla çıkmak mümkün ama pek sürdürülebilir değil.</p>}
  {report.issues.length?<ul>{report.issues.map((issue,index)=><li key={`${issue.message}-${index}`} data-severity={issue.severity}>{issue.message}</li>)}</ul>:<p>Envanter, ekipman slotları ve taşıma kapasitesi tutarlı.</p>}
 </section>
}
