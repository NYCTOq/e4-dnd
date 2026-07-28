export type CrossDomainRuleset = "2014" | "2024";
export type CrossDomainArchetype = "martial" | "prepared-caster" | "known-caster" | "multiclass";

export type CrossDomainPayload = {
  id: string;
  ruleset: CrossDomainRuleset;
  level: number;
  className: string;
  subclassName: string | null;
  classLevels: Readonly<Record<string, number>>;
  ancestry: string;
  background: string;
  abilities: Readonly<Record<"str"|"dex"|"con"|"int"|"wis"|"cha", number>>;
  skillProficiencies: readonly string[];
  saveProficiencies: readonly string[];
  featIds: readonly string[];
  knownSpellIds: readonly string[];
  preparedSpellIds: readonly string[];
  inventoryIds: readonly string[];
  equippedItemIds: readonly string[];
  resources: readonly { id: string; max: number; used: number; recovery: "short"|"long"|"manual" }[];
};

export type CrossDomainCanonicalSnapshot = {
  identity: { id: string; ruleset: CrossDomainRuleset; level: number };
  classIdentity: { className: string; subclassName: string | null; classLevels: readonly [string, number][] };
  origin: { ancestry: string; background: string };
  abilities: readonly [string, number][];
  proficiencies: { skills: readonly string[]; saves: readonly string[] };
  selections: { feats: readonly string[]; knownSpells: readonly string[]; preparedSpells: readonly string[] };
  inventory: { owned: readonly string[]; equipped: readonly string[] };
  resources: readonly { id: string; max: number; used: number; remaining: number; recovery: string }[];
};

const sorted = (values: readonly string[]) => [...new Set(values)].sort((a,b)=>a.localeCompare(b));
const entries = (value: Readonly<Record<string, number>>) => Object.entries(value).filter(([,n])=>n>0).sort(([a],[b])=>a.localeCompare(b));

export function buildCrossDomainReferenceSnapshot(payload: CrossDomainPayload): CrossDomainCanonicalSnapshot {
  const prepared = payload.ruleset === "2024" ? sorted(payload.preparedSpellIds) : sorted(payload.preparedSpellIds);
  return {
    identity: { id: payload.id, ruleset: payload.ruleset, level: payload.level },
    classIdentity: { className: payload.className.trim(), subclassName: payload.subclassName?.trim() || null, classLevels: entries(payload.classLevels) },
    origin: { ancestry: payload.ancestry.trim(), background: payload.background.trim() },
    abilities: Object.entries(payload.abilities).sort(([a],[b])=>a.localeCompare(b)),
    proficiencies: { skills: sorted(payload.skillProficiencies), saves: sorted(payload.saveProficiencies) },
    selections: { feats: sorted(payload.featIds), knownSpells: sorted(payload.knownSpellIds), preparedSpells: prepared },
    inventory: { owned: sorted(payload.inventoryIds), equipped: sorted(payload.equippedItemIds.filter(id=>payload.inventoryIds.includes(id))) },
    resources: [...payload.resources].map(r=>({id:r.id,max:r.max,used:r.used,remaining:Math.max(0,r.max-r.used),recovery:r.recovery})).sort((a,b)=>a.id.localeCompare(b.id)),
  };
}

export function compareCrossDomainSnapshots(reference: CrossDomainCanonicalSnapshot, actual: CrossDomainCanonicalSnapshot) {
  const differences: string[]=[];
  const visit=(path:string,a:unknown,b:unknown)=>{
    if(JSON.stringify(a)!==JSON.stringify(b)) differences.push(path);
  };
  visit("identity",reference.identity,actual.identity);
  visit("classIdentity",reference.classIdentity,actual.classIdentity);
  visit("origin",reference.origin,actual.origin);
  visit("abilities",reference.abilities,actual.abilities);
  visit("proficiencies",reference.proficiencies,actual.proficiencies);
  visit("selections.feats",reference.selections.feats,actual.selections.feats);
  visit("selections.knownSpells",reference.selections.knownSpells,actual.selections.knownSpells);
  visit("selections.preparedSpells",reference.selections.preparedSpells,actual.selections.preparedSpells);
  visit("inventory",reference.inventory,actual.inventory);
  visit("resources",reference.resources,actual.resources);
  return { consistent:differences.length===0, differences } as const;
}
