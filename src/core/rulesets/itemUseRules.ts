import type{CharacterInventoryItem}from"../character/character.types";import type{DndItemData}from"./ruleset.types";
export function isConsumableItem(item:DndItemData){return item.category==="ammunition"||item.tags?.some(tag=>tag.toLowerCase()==="consumable")===true}
export function getItemHealingFormula(item:DndItemData){const match=item.description.match(/restores?\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);return match?match[1].replace(/\s/g,""):null}
export function consumeInventoryItem(inventory:CharacterInventoryItem[],itemId:string,amount=1){return inventory.flatMap(entry=>{if(entry.itemId!==itemId)return[entry];const quantity=Math.max(0,entry.quantity-Math.max(1,Math.floor(amount)));return quantity?[{...entry,quantity}]:[]})}
