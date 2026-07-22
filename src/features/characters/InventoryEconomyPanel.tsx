import type { Character } from "../../core/character/character.types";
import type { DndItemData } from "../../core/rulesets/ruleset.types";
import { getInventoryEconomySnapshot } from "../../core/rulesets/inventoryEconomyRuntime";
export function InventoryEconomyPanel({character,items}:{character:Character;items:DndItemData[]}){
 const report=getInventoryEconomySnapshot(character,items);
 return <section className="inventory-economy-panel" data-testid="inventory-economy-panel">
  <div className="play-mode-section-head"><div><span className="mini-label">Inventory Runtime</span><h2>Equipment & Economy</h2></div><strong>{report.ready?"Ready":"Blocked"}</strong></div>
  <div className="inventory-economy-stats"><span><strong>{report.gold}</strong> gp</span><span><strong>{report.weight.toFixed(1)}</strong> / {report.capacity} lb</span><span><strong>{report.attuned}</strong> / 3 attuned</span><span><strong>{report.ammunition}</strong> ammo</span><span><strong>{report.consumables}</strong> consumable</span></div>
  <progress max={Math.max(100,report.loadPercent)} value={report.loadPercent} aria-label="Carrying capacity usage" />
  {report.issues.length?<ul>{report.issues.map((issue,index)=><li key={`${issue.message}-${index}`} data-severity={issue.severity}>{issue.message}</li>)}</ul>:<p>Envanter, ekipman slotları ve taşıma kapasitesi tutarlı.</p>}
 </section>
}
