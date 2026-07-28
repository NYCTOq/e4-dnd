import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);
const mustReplace = (source, from, to, label) => {
  if (!source.includes(from)) throw new Error(`[v5.131] ${label} anchor not found`);
  return source.replace(from, to);
};

// 1) Centralize subclass resource state, spending and rest recovery.
{
  const file = 'src/core/rulesets/subclassRuntimeRules.ts';
  let s = read(file);
  s = mustReplace(
    s,
    'export function canUseSubclassAction(action:SubclassRuntimeAction,resources:CharacterResource[]){if(!action.resourceId)return true;const resource=resources.find(item=>item.id===action.resourceId);return Boolean(resource&&resource.used<resource.max)}\nexport function spendSubclassActionResource(action:SubclassRuntimeAction,resources:CharacterResource[]){if(!action.resourceId)return resources;return resources.map(item=>item.id===action.resourceId?{...item,used:Math.min(item.max,item.used+1)}:item)}',
    `export type SubclassActionResourceState={\n id:string;name:string;remaining:number;maximum:number;available:boolean;unlimited:boolean\n};\n\nexport function getSubclassActionResourceState(action:SubclassRuntimeAction,resources:CharacterResource[]):SubclassActionResourceState|null{\n if(!action.resourceId)return null;\n const resource=resources.find(item=>item.id===action.resourceId);\n if(!resource)return{id:action.resourceId,name:action.resourceId,remaining:0,maximum:0,available:false,unlimited:false};\n const unlimited=Boolean(resource.unlimited);\n const remaining=unlimited?resource.max:Math.max(0,resource.max-resource.used);\n return{id:resource.id,name:resource.name,remaining,maximum:resource.max,available:unlimited||remaining>0,unlimited};\n}\n\nexport function canUseSubclassAction(action:SubclassRuntimeAction,resources:CharacterResource[]){\n const state=getSubclassActionResourceState(action,resources);\n return state?state.available:true;\n}\n\nexport function spendSubclassActionResource(action:SubclassRuntimeAction,resources:CharacterResource[]){\n if(!action.resourceId)return resources;\n return resources.map(item=>{\n  if(item.id!==action.resourceId||item.unlimited)return item;\n  return{...item,used:Math.min(item.max,item.used+1)};\n });\n}\n\nexport function recoverSubclassResources(resources:CharacterResource[],rest:"short"|"long"){\n return resources.map(resource=>{\n  if(resource.unlimited||resource.recovery==="manual")return resource;\n  if(rest==="short"&&resource.recovery!=="short")return resource;\n  if(rest==="short"){\n   const amount=resource.shortRecoveryAmount??resource.max;\n   return{...resource,used:Math.max(0,resource.used-amount)};\n  }\n  return{...resource,used:0};\n });\n}`,
    'subclass resource helpers',
  );
  write(file, s);
}

// 2) Wire resource state and centralized recovery into Play Mode.
{
  const file = 'src/features/play-mode/PlayMode.tsx';
  let s = read(file);
  s = mustReplace(
    s,
    'import { canUseSubclassAction, getSubclassRuntime, spendSubclassActionResource, type SubclassRuntimeAction } from "../../core/rulesets/subclassRuntimeRules";',
    'import { canUseSubclassAction, getSubclassActionResourceState, getSubclassRuntime, recoverSubclassResources, spendSubclassActionResource, type SubclassRuntimeAction } from "../../core/rulesets/subclassRuntimeRules";',
    'play mode subclass import',
  );
  s = mustReplace(
    s,
    'resources: recoverHomebrewCharacterResources({...activeCharacter,resources:activeCharacter.resources.map(resource=>resource.recovery==="short"&&!resource.unlimited?{...resource,used:Math.max(0,resource.used-(resource.shortRecoveryAmount??resource.max))}:resource)},homebrewPackages,"short-rest"),',
    'resources: recoverHomebrewCharacterResources({...activeCharacter,resources:recoverSubclassResources(activeCharacter.resources,"short")},homebrewPackages,"short-rest"),',
    'short rest subclass recovery',
  );
  s = mustReplace(
    s,
    'resources: recoverHomebrewCharacterResources({...activeCharacter,resources:activeCharacter.resources.map(resource=>resource.id.startsWith("homebrew:")?resource:{...resource,used:0})},homebrewPackages,"long-rest"),',
    'resources: recoverHomebrewCharacterResources({...activeCharacter,resources:recoverSubclassResources(activeCharacter.resources,"long")},homebrewPackages,"long-rest"),',
    'long rest subclass recovery',
  );
  s = mustReplace(
    s,
    'function handleSubclassAction(action:SubclassRuntimeAction){if(!canUseSubclassAction(action,activeCharacter.resources))return;if(action.type==="action"&&turnEconomy.actionUsed||action.type==="bonus-action"&&turnEconomy.bonusActionUsed||action.type==="reaction"&&turnEconomy.reactionUsed)return;const resources=spendSubclassActionResource(action,activeCharacter.resources);if(action.id==="tides-of-chaos")setCheckMode("advantage");const damage=action.id==="radiance-of-dawn"?rollDice({count:Math.max(2,Math.ceil(activeCharacter.level/2)),sides:10,modifier:getAbilityModifier(effectiveCharacter.abilities.wis)}):null;const healing=action.id==="preserve-life"?getPreserveLifeHealing(activeCharacter.level,activeCharacter.currentHp,activeCharacter.maxHp):0;commit({resources,currentHp:healing?Math.min(activeCharacter.maxHp,activeCharacter.currentHp+healing):activeCharacter.currentHp});setTurnEconomy(current=>spendTurnResource(current,action.type));setRollHistory(current=>[{id:damage?.id??crypto.randomUUID(),label:`${activeCharacter.subclass} · ${action.name}`,notation:damage?.notation??(healing?`+${healing} HP`:action.type),total:damage?.total??healing},...current].slice(0,6))}',
    'function handleSubclassAction(action:SubclassRuntimeAction){if(!canUseSubclassAction(action,activeCharacter.resources)){setActionFeedback(`${action.name} için kullanılabilir kaynak yok.`);return}if(action.type==="action"&&turnEconomy.actionUsed||action.type==="bonus-action"&&turnEconomy.bonusActionUsed||action.type==="reaction"&&turnEconomy.reactionUsed){setActionFeedback(`${action.name} için ${action.type} ekonomisi zaten kullanıldı.`);return}const resources=spendSubclassActionResource(action,activeCharacter.resources);if(action.id==="tides-of-chaos")setCheckMode("advantage");const damage=action.id==="radiance-of-dawn"?rollDice({count:Math.max(2,Math.ceil(activeCharacter.level/2)),sides:10,modifier:getAbilityModifier(effectiveCharacter.abilities.wis)}):null;const healing=action.id==="preserve-life"?getPreserveLifeHealing(activeCharacter.level,activeCharacter.currentHp,activeCharacter.maxHp):0;commit({resources,currentHp:healing?Math.min(activeCharacter.maxHp,activeCharacter.currentHp+healing):activeCharacter.currentHp});setTurnEconomy(current=>spendTurnResource(current,action.type));const state=getSubclassActionResourceState(action,resources);setActionFeedback(state?`${action.name} kullanıldı · ${state.unlimited?"Sınırsız":`${state.remaining}/${state.maximum} kaldı`}`:`${action.name} kullanıldı.`);setRollHistory(current=>[{id:damage?.id??crypto.randomUUID(),label:`${activeCharacter.subclass} · ${action.name}`,notation:damage?.notation??(healing?`+${healing} HP`:action.type),total:damage?.total??healing},...current].slice(0,6))}',
    'subclass action feedback',
  );
  s = mustReplace(
    s,
    '{subclassRuntime.actions.length?<div className="play-mode-big-buttons">{subclassRuntime.actions.map(action=><button type="button" key={action.id} disabled={!canUseSubclassAction(action,activeCharacter.resources)||(action.type==="action"&&turnEconomy.actionUsed)||(action.type==="bonus-action"&&turnEconomy.bonusActionUsed)||(action.type==="reaction"&&turnEconomy.reactionUsed)} onClick={()=>handleSubclassAction(action)}>{action.name} · {action.type}</button>)}</div>:null}',
    '{subclassRuntime.actions.length?<div className="play-mode-big-buttons">{subclassRuntime.actions.map(action=>{const resourceState=getSubclassActionResourceState(action,activeCharacter.resources);return <button type="button" key={action.id} data-testid={`subclass-action-${action.id}`} disabled={!canUseSubclassAction(action,activeCharacter.resources)||(action.type==="action"&&turnEconomy.actionUsed)||(action.type==="bonus-action"&&turnEconomy.bonusActionUsed)||(action.type==="reaction"&&turnEconomy.reactionUsed)} onClick={()=>handleSubclassAction(action)}><span>{action.name} · {action.type}</span>{resourceState?<small>{resourceState.unlimited?"Sınırsız":`${resourceState.remaining}/${resourceState.maximum} kullanım`}</small>:null}</button>})}</div>:null}',
    'subclass action resource labels',
  );
  write(file, s);
}

// 3) Package scripts/version.
{
  const file = 'package.json';
  const pkg = JSON.parse(read(file));
  pkg.version = '5.131.0';
  pkg.scripts ??= {};
  pkg.scripts['test:subclass-runtime-completion'] = 'vitest run src/core/rulesets/subclassRuntimeCompletion-v5.131.test.ts';
  pkg.scripts['certify:subclass-runtime-completion'] = 'npm run test:subclass-runtime-completion && npm run build';
  write(file, JSON.stringify(pkg, null, 2) + '\n');
}

console.log('[v5.131] Subclass runtime completion installed.');
