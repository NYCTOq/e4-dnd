import type { CrossDomainCanonicalSnapshot, CrossDomainPayload } from "../oracle/crossDomainBuilderRecordSheetOracle";

const uniqueSorted=(values:readonly string[])=>Array.from(new Set(values)).sort();

export function buildRuntimeBuilderRecordSheetSnapshot(record: CrossDomainPayload): CrossDomainCanonicalSnapshot {
  const classLevels=Object.keys(record.classLevels).sort().flatMap(name=>record.classLevels[name]>0?[[name,record.classLevels[name]] as [string,number]]:[]);
  const abilityRows=(Object.keys(record.abilities) as (keyof typeof record.abilities)[]).sort().map(key=>[key,record.abilities[key]] as [string,number]);
  return {
    identity:{id:record.id,ruleset:record.ruleset,level:record.level},
    classIdentity:{className:record.className.trim(),subclassName:record.subclassName?.trim()||null,classLevels},
    origin:{ancestry:record.ancestry.trim(),background:record.background.trim()},
    abilities:abilityRows,
    proficiencies:{skills:uniqueSorted(record.skillProficiencies),saves:uniqueSorted(record.saveProficiencies)},
    selections:{feats:uniqueSorted(record.featIds),knownSpells:uniqueSorted(record.knownSpellIds),preparedSpells:uniqueSorted(record.preparedSpellIds)},
    inventory:{owned:uniqueSorted(record.inventoryIds),equipped:uniqueSorted(record.equippedItemIds.filter(id=>record.inventoryIds.indexOf(id)>=0))},
    resources:record.resources.map(resource=>({id:resource.id,max:resource.max,used:resource.used,remaining:Math.max(0,resource.max-resource.used),recovery:resource.recovery})).sort((a,b)=>a.id.localeCompare(b.id)),
  };
}
