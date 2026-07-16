import { useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import type { AbilityKey, Character, CharacterCondition } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { rollDice } from "../../core/dice/diceRoller";
import {
  formatModifier,
  getAbilityModifier,
  getInitiative,
  getProficiencyBonus,
  getSpellAttackBonus,
  getSpellSaveDc,
} from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { getPlayReadiness } from "../../core/character/playReadiness";
import { getMetamagicOptions } from "../../core/rulesets/metamagicRules";
import { getEldritchInvocations } from "../../core/rulesets/invocationRules";
import { getWildShapeForms } from "../../core/rulesets/wildShapeRules";
import { getBattleMasterManeuvers, getSuperiorityDie } from "../../core/rulesets/maneuverRules";
import { getCompanionStats, getRangerCompanions } from "../../core/rulesets/companionRules";
import { getClassFeatureActions } from "../../core/rulesets/classFeatureEngine";
import { getDivineSmiteDice, getPaladinAuraSummary, isPaladin } from "../../core/rulesets/paladinRules";
import { getCastableSlotLevels, getSpellRollFormula, rollFormula } from "../../core/rulesets/spellResolution";
import { addSpellEffect, advanceSpellEffects, createSpellEffect } from "../../core/rulesets/spellEffectRules";
import { applyDamage, applyHealing, resolveDeathSave } from "../../core/character/survivalRules";
import { getCriticalDamageFormula, resolveAttack, type RollMode } from "../../core/rulesets/attackResolution";
import { combineRollModes, getConditionEffects } from "../../core/rulesets/conditionRules";
import { getSavingThrowBonus, getSkillBonus, SKILL_ABILITIES } from "../../core/rulesets/characterSheetRules";
import { chooseD20 } from "../../core/rulesets/attackResolution";
import { getEffectiveMaxHp, getEffectiveSpeed, getExhaustionEffects } from "../../core/rulesets/exhaustionRules";
import { getDefaultSaveDamageRule, resolveSaveDamage, resolveTargetSave, type SaveDamageRule } from "../../core/rulesets/spellTargetRules";
import { createTurnEconomy, getAttacksPerAction, spendAttack, spendMovement, spendTurnResource } from "../../core/rulesets/actionEconomyRules";
import { canUseSneakAttack, getRogueCombatFeatures, getSneakAttackDice } from "../../core/rulesets/rogueRules";
import { getBarbarianCombatFeatures, getBrutalCriticalExtraDice, getRageDamageBonus, isRageDamageWeapon, reduceRageDamage } from "../../core/rulesets/barbarianRules";
import { getMartialArtsDie, getMonkCombatFeatures, getUnarmoredMovementBonus } from "../../core/rulesets/monkRules";
import { getBardCombatFeatures, getBardicInspirationDie, getInspirationRecovery } from "../../core/rulesets/bardRules";
import { getFighterCombatFeatures, getIndomitableBonus } from "../../core/rulesets/fighterRules";
import { getClericCombatFeatures, getDivineSparkDice } from "../../core/rulesets/clericRules";
import { canCreateSorcerySlot, getPointsFromSlot, getSorcererCombatFeatures, getSorcerySlotCost } from "../../core/rulesets/sorcererRules";
import { canRecoverWizardSlot, getArcaneRecoveryBudget, getWizardCombatFeatures } from "../../core/rulesets/wizardRules";
import { getHuntersMarkDamage, getRangerCombatFeatures } from "../../core/rulesets/rangerRules";
import { getFeatRuntime } from "../../core/rulesets/featRuntimeRules";
import {
  calculateEffectiveArmorClass,
  getEquippedItems,
  getSpellLevelGroups,
  getWeaponAttackBonus,
  getWeaponDamageSummary,
  isSpellReadyToCast,
  normalizeHitDice,
  normalizeSpellSlots,
  resetDeathSaves,
  resetHitDice,
  resetSpellSlots,
  sortSpellsByLevelAndName,
} from "../characters/characterShared";

const conditionOptions: CharacterCondition[] = [
  "Blessed",
  "Blinded",
  "Charmed",
  "Deafened",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Invisible",
  "Stunned",
  "Restrained",
  "Unconscious",
  "Concentration",
  "Rage",
  "Haki",
  "Cursed",
];

const abilityLabels: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

type RollResult = {
  id: string;
  label: string;
  notation: string;
  total: number;
};

export function PlayMode({
  characters,
  rulesetData,
  onUpdateCharacter,
}: {
  characters: Character[];
  rulesetData: RulesetData | null;
  onUpdateCharacter: (character: Character) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    () => searchParams.get("character") ?? characters[0]?.id ?? "",
  );
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [smiteHolyTarget,setSmiteHolyTarget]=useState(false);
  const [castSlotLevels,setCastSlotLevels]=useState<Record<string,number>>({});
  const [survivalAmount,setSurvivalAmount]=useState(1);
  const [pendingConcentrationDc,setPendingConcentrationDc]=useState<number|null>(null);
  const [targetAc,setTargetAc]=useState(10);
  const [attackMode,setAttackMode]=useState<RollMode>("normal");
  const [checkMode,setCheckMode]=useState<RollMode>("normal");
  const [spellTargetMode,setSpellTargetMode]=useState<RollMode>("normal");
  const [targetSaveBonus,setTargetSaveBonus]=useState(0);
  const [saveDamageRule,setSaveDamageRule]=useState<SaveDamageRule>("half");
  const [turnEconomy,setTurnEconomy]=useState(createTurnEconomy);
  const [arcaneRecoveryLevels,setArcaneRecoveryLevels]=useState<number[]>([]);
  const [luckyUsed,setLuckyUsed]=useState(0);
  const [sneakAttackUsed,setSneakAttackUsed]=useState(false);
  const [sneakAttackEnabled,setSneakAttackEnabled]=useState(true);
  const [sneakAllyAdjacent,setSneakAllyAdjacent]=useState(false);
  const [recklessAttack,setRecklessAttack]=useState(false);
  const [incomingPhysical,setIncomingPhysical]=useState(true);

  const character =
    characters.find((item) => item.id === selectedCharacterId) ?? characters[0];

  const preparedSpellIds = useMemo(
    () => new Set(character?.preparedSpellIds ?? []),
    [character?.preparedSpellIds],
  );

  if (!character) {
    return (
      <PageShell
        eyebrow="Table Mode"
        title="Play Mode"
        description="Önce bir karakter oluşturmalısın. Uygulama kahramanı havadan üretmiyor, henüz."
      >
        <div className="empty-panel">Play Mode için kayıtlı karakter bulunamadı.</div>
      </PageShell>
    );
  }

  const activeCharacter = character;
  const spellSlots = normalizeSpellSlots(
    activeCharacter.spellSlots,
    activeCharacter.level,
    activeCharacter.className,
  );
  const selectedClass = rulesetData?.classes.find(
    (item) => item.name === activeCharacter.className,
  );
  const hitDice = normalizeHitDice(
    activeCharacter.hitDice,
    activeCharacter.level,
    activeCharacter.className,
    selectedClass?.hitDie,
  );
  const spells = sortSpellsByLevelAndName(
    rulesetData?.spells.filter(
      (spell) =>
        activeCharacter.knownSpellIds?.includes(spell.id) &&
        isSpellReadyToCast(spell, preparedSpellIds),
    ) ?? [],
  );
  const spellGroups = getSpellLevelGroups(spells);
  const equippedItems = getEquippedItems(activeCharacter, rulesetData?.items);
  const armorClass = calculateEffectiveArmorClass(
    activeCharacter,
    rulesetData?.items,
  );
  const readiness = getPlayReadiness(activeCharacter, rulesetData);
  const metamagicOptions = getMetamagicOptions(activeCharacter.ruleset).filter((option) =>
    activeCharacter.metamagicIds?.includes(option.id),
  );
  const sorceryPoints = activeCharacter.resources.find((resource) => resource.id === "sorcery-points");
  const invocations = getEldritchInvocations(activeCharacter.ruleset).filter((option) => activeCharacter.invocationIds?.includes(option.id));
  const wildShapeForms = getWildShapeForms().filter((form) => activeCharacter.wildShapeFormIds?.includes(form.id));
  const wildShapeResource = activeCharacter.resources.find((resource) => resource.id === "wild-shape");
  const maneuvers=getBattleMasterManeuvers().filter(item=>activeCharacter.maneuverIds?.includes(item.id));
  const superiorityDice=activeCharacter.resources.find(resource=>resource.id==="superiority-dice");
  const companion=getRangerCompanions(activeCharacter.ruleset).find(item=>item.id===activeCharacter.companionId);
  const companionStats=companion?getCompanionStats(companion,activeCharacter.level,getAbilityModifier(activeCharacter.abilities.wis)):null;
  const companionCurrentHp=companionStats?Math.min(companionStats.maxHp,Math.max(0,activeCharacter.companionCurrentHp??companionStats.maxHp)):0;
  const handledResourceIds=new Set(["sorcery-points","wild-shape","superiority-dice","focus-points","bardic-inspiration","second-wind","action-surge","indomitable","channel-divinity","arcane-recovery","favored-enemy"]);
  const classActions=getClassFeatureActions(activeCharacter.className,activeCharacter.level,activeCharacter.ruleset).filter(action=>action.resourceId&&!handledResourceIds.has(action.resourceId)&&activeCharacter.resources.some(resource=>resource.id===action.resourceId));
  const arcanumSpells=(rulesetData?.spells??[]).filter(spell=>activeCharacter.arcanumSpellIds?.includes(spell.id));
  const paladinAuras=isPaladin(activeCharacter.className)?getPaladinAuraSummary(activeCharacter.level):null;
  const activeSpellEffects=activeCharacter.activeSpellEffects??[];
  const conditionEffects=getConditionEffects(activeCharacter.conditions);
  const exhaustionEffects=getExhaustionEffects(activeCharacter.ruleset,activeCharacter.exhaustion);
  const selectedRace=rulesetData?.races.find(race=>race.name===activeCharacter.race);
  const selectedBackground=rulesetData?.backgrounds.find(background=>background.name===activeCharacter.background);
  const featNames=[...(rulesetData?.feats.filter(feat=>activeCharacter.featIds.includes(feat.id)).map(feat=>feat.name)??[]),...(selectedBackground?.originFeat?[selectedBackground.originFeat]:[])];
  const featRuntime=getFeatRuntime(featNames,activeCharacter.level,activeCharacter.ruleset);
  const effectiveSpeed=getEffectiveSpeed((selectedRace?.speed??30)+featRuntime.speedBonus,exhaustionEffects);
  const effectiveMaxHp=getEffectiveMaxHp(activeCharacter.maxHp,exhaustionEffects);
  const attacksPerAction=getAttacksPerAction(activeCharacter.className,activeCharacter.level);
  const isRogue=activeCharacter.className.trim().toLowerCase()==="rogue";
  const rogueFeatures=getRogueCombatFeatures(activeCharacter.level);
  const isBarbarian=activeCharacter.className.trim().toLowerCase()==="barbarian";
  const barbarianFeatures=getBarbarianCombatFeatures(activeCharacter.level);
  const isRaging=activeCharacter.conditions.includes("Rage");
  const isMonk=activeCharacter.className.trim().toLowerCase()==="monk";
  const monkFeatures=getMonkCombatFeatures(activeCharacter.level);
  const focusPoints=activeCharacter.resources.find(resource=>resource.id==="focus-points");
  const isBard=activeCharacter.className.trim().toLowerCase()==="bard";
  const bardFeatures=getBardCombatFeatures(activeCharacter.level,activeCharacter.ruleset);
  const bardicInspiration=activeCharacter.resources.find(resource=>resource.id==="bardic-inspiration");
  const isFighter=activeCharacter.className.trim().toLowerCase()==="fighter";
  const fighterFeatures=getFighterCombatFeatures(activeCharacter.level);
  const actionSurge=activeCharacter.resources.find(resource=>resource.id==="action-surge");
  const indomitable=activeCharacter.resources.find(resource=>resource.id==="indomitable");
  const secondWind=activeCharacter.resources.find(resource=>resource.id==="second-wind");
  const isCleric=activeCharacter.className.trim().toLowerCase()==="cleric";
  const clericFeatures=getClericCombatFeatures(activeCharacter.level,activeCharacter.ruleset);
  const channelDivinity=activeCharacter.resources.find(resource=>resource.id==="channel-divinity");
  const isSorcerer=activeCharacter.className.trim().toLowerCase()==="sorcerer";
  const sorcererFeatures=getSorcererCombatFeatures(activeCharacter.level);
  const isWizard=activeCharacter.className.trim().toLowerCase()==="wizard";
  const wizardFeatures=getWizardCombatFeatures(activeCharacter.level);
  const arcaneRecovery=activeCharacter.resources.find(resource=>resource.id==="arcane-recovery");
  const isRanger=activeCharacter.className.trim().toLowerCase()==="ranger";
  const rangerFeatures=getRangerCombatFeatures(activeCharacter.level,activeCharacter.ruleset);
  const favoredEnemy=activeCharacter.resources.find(resource=>resource.id==="favored-enemy");

  function commit(patch: Partial<Character>) {
    onUpdateCharacter({
      ...activeCharacter,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  function spendSorceryPoints(cost: number) {
    if (!sorceryPoints || sorceryPoints.max - sorceryPoints.used < cost) return;
    commit({
      resources: activeCharacter.resources.map((resource) =>
        resource.id === "sorcery-points"
          ? { ...resource, used: Math.min(resource.max, resource.used + cost) }
          : resource,
      ),
    });
  }

  function useWildShape() {
    if (!wildShapeResource || wildShapeResource.used >= wildShapeResource.max) return;
    commit({ resources: activeCharacter.resources.map(resource=>resource.id==="wild-shape"?{...resource,used:Math.min(resource.max,resource.used+1)}:resource) });
  }
  function useSuperiorityDie(){if(!superiorityDice||superiorityDice.used>=superiorityDice.max)return;commit({resources:activeCharacter.resources.map(resource=>resource.id==="superiority-dice"?{...resource,used:Math.min(resource.max,resource.used+1)}:resource)})}
  function updateCompanionHp(amount:number){if(!companionStats)return;commit({companionCurrentHp:Math.min(companionStats.maxHp,Math.max(0,companionCurrentHp+amount))})}
  function executeClassAction(resourceId:string,amount=1){const resource=activeCharacter.resources.find(item=>item.id===resourceId);if(!resource||resource.max-resource.used<amount)return;let currentHp=activeCharacter.currentHp;let conditions=activeCharacter.conditions;if(resourceId==="second-wind"){const result=rollDice({count:1,sides:10,modifier:activeCharacter.level});currentHp=Math.min(activeCharacter.maxHp,currentHp+result.total);setRollHistory(current=>[{id:result.id,label:"Second Wind",notation:result.notation,total:result.total},...current].slice(0,6))}if(resourceId==="lay-on-hands")currentHp=Math.min(activeCharacter.maxHp,currentHp+amount);if(resourceId==="rage"&&!conditions.includes("Rage"))conditions=[...conditions,"Rage"];commit({currentHp,conditions,resources:activeCharacter.resources.map(item=>item.id===resourceId?{...item,used:Math.min(item.max,item.used+amount)}:item)})}
  function castArcanum(spellId:string){if(activeCharacter.usedArcanumSpellIds?.includes(spellId))return;commit({usedArcanumSpellIds:[...(activeCharacter.usedArcanumSpellIds??[]),spellId]})}
  function divineSmite(slotLevel:number){const slot=spellSlots.find(item=>item.level===slotLevel);if(!slot||slot.used>=slot.max)return;const dice=getDivineSmiteDice(slotLevel,activeCharacter.ruleset,smiteHolyTarget);const result=rollDice({count:dice,sides:8,modifier:0});commit({spellSlots:spellSlots.map(item=>item.level===slotLevel?{...item,used:item.used+1}:item)});setRollHistory(current=>[{id:result.id,label:`Divine Smite · Level ${slotLevel}`,notation:result.notation,total:result.total},...current].slice(0,6))}
  function advanceEffectRound(){const next=advanceSpellEffects(activeSpellEffects);commit({activeSpellEffects:next,conditions:next.some(effect=>effect.concentration)?activeCharacter.conditions:activeCharacter.conditions.filter(condition=>condition!=="Concentration")})}
  function endSpellEffect(id:string){const next=activeSpellEffects.filter(effect=>effect.id!==id);commit({activeSpellEffects:next,conditions:next.some(effect=>effect.concentration)?activeCharacter.conditions:activeCharacter.conditions.filter(condition=>condition!=="Concentration")})}
  function concentrationSave(dc:number){const result=rollDice({count:1,sides:20,modifier:getAbilityModifier(activeCharacter.abilities.con)});const success=result.total>=dc;commit(success?{}:{activeSpellEffects:activeSpellEffects.filter(effect=>!effect.concentration),conditions:activeCharacter.conditions.filter(condition=>condition!=="Concentration")});setPendingConcentrationDc(null);setRollHistory(current=>[{id:result.id,label:`Concentration Save DC ${dc} · ${success?"Başarılı":"Başarısız"}`,notation:result.notation,total:result.total},...current].slice(0,6))}

  function takeDamage(critical=false){const finalDamage=reduceRageDamage(survivalAmount,isRaging,incomingPhysical);const result=applyDamage({currentHp:activeCharacter.currentHp,maxHp:activeCharacter.maxHp,tempHp:activeCharacter.tempHp,deathSaves:activeCharacter.deathSaves},finalDamage,critical);commit({currentHp:result.currentHp,tempHp:result.tempHp,deathSaves:result.deathSaves});if(activeSpellEffects.some(effect=>effect.concentration))setPendingConcentrationDc(result.concentrationDc);setRollHistory(current=>[{id:crypto.randomUUID(),label:`${critical?"Kritik ":""}Hasar${finalDamage!==survivalAmount?" · Rage Resistance":""}${result.absorbedByTempHp?` · ${result.absorbedByTempHp} Temp HP emdi`:""}`,notation:`-${finalDamage} HP`,total:-finalDamage},...current].slice(0,6))}
  function healDamage(){const result=applyHealing({currentHp:activeCharacter.currentHp,maxHp:activeCharacter.maxHp,tempHp:activeCharacter.tempHp,deathSaves:activeCharacter.deathSaves},survivalAmount);commit({currentHp:result.currentHp,deathSaves:result.deathSaves})}
  function rollDeathSave(){const roll=rollDice({count:1,sides:20,modifier:0});const result=resolveDeathSave({currentHp:activeCharacter.currentHp,maxHp:activeCharacter.maxHp,tempHp:activeCharacter.tempHp,deathSaves:activeCharacter.deathSaves},roll.rolls[0]);commit({currentHp:result.currentHp,deathSaves:result.deathSaves});setRollHistory(current=>[{id:roll.id,label:`Death Save${roll.rolls[0]===20?" · Natural 20":roll.rolls[0]===1?" · Natural 1":""}`,notation:roll.notation,total:roll.total},...current].slice(0,6))}

  function updateHp(amount: number) {
    commit({
      currentHp: Math.max(
        0,
        Math.min(activeCharacter.maxHp, activeCharacter.currentHp + amount),
      ),
    });
  }

  function toggleCondition(condition: CharacterCondition) {
    const active = activeCharacter.conditions.includes(condition);
    const conditionDurations = { ...(activeCharacter.conditionDurations ?? {}) };

    if (active) {
      delete conditionDurations[condition];
    }

    commit({
      conditions: active
        ? activeCharacter.conditions.filter((item) => item !== condition)
        : [...activeCharacter.conditions, condition],
      conditionDurations,
    });
  }

  function spendSlot(level: number, amount: number) {
    commit({
      spellSlots: spellSlots.map((slot) =>
        slot.level === level
          ? { ...slot, used: Math.min(slot.max, Math.max(0, slot.used + amount)) }
          : slot,
      ),
    });
  }

  function castSpell(spellId: string, requestedSlotLevel?:number) {
    const spell = rulesetData?.spells.find((item) => item.id === spellId);

    if (!spell) return;
    const spellTime=spell.castingTime.toLowerCase();
    if ((spellTime.includes("bonus")&&turnEconomy.bonusActionUsed)||(spellTime.includes("reaction")&&turnEconomy.reactionUsed)||(!spellTime.includes("bonus")&&!spellTime.includes("reaction")&&turnEconomy.actionUsed)) return;

    const slotLevel=spell.level===0?0:requestedSlotLevel??getCastableSlotLevels(spell,spellSlots)[0];
    if (spell.level > 0) {
      const slot = spellSlots.find((item) => item.level === slotLevel);
      if (!slot || slot.used >= slot.max) return;
    }

    const nextConditions =
      spell.concentration &&
      !activeCharacter.conditions.includes("Concentration")
        ? [...activeCharacter.conditions, "Concentration" as const]
        : activeCharacter.conditions;

    const formula=getSpellRollFormula(spell,activeCharacter.level,slotLevel);const total=formula?rollFormula(formula):null;const createdEffect=createSpellEffect(spell);const nextEffects=createdEffect?addSpellEffect(activeSpellEffects,createdEffect):activeSpellEffects;
    commit({
      currentHp:spell.healingDice&&total!==null?Math.min(activeCharacter.maxHp,activeCharacter.currentHp+Math.max(0,total)):activeCharacter.currentHp,
      spellSlots:
        spell.level === 0
          ? spellSlots
          : spellSlots.map((slot) =>
              slot.level === slotLevel
                ? { ...slot, used: slot.used + 1 }
                : slot,
            ),
      conditions: nextConditions,
      activeSpellEffects:nextEffects,
    });
    const resolutionRolls:RollResult[]=[];let resolvedDamage=total;if(spell.attackType==="spell-attack"){const dice=rollDice({count:spellTargetMode==="normal"?1:2,sides:20,modifier:0});const attack=resolveAttack(dice.rolls,getSpellAttackBonus(activeCharacter),targetAc,spellTargetMode);resolutionRolls.push({id:dice.id,label:`${spell.name} Attack · ${attack.hit?attack.critical?"CRITICAL":"Hit":"Miss"}`,notation:`${spellTargetMode} · [${dice.rolls.join(", ")}] vs AC ${targetAc}`,total:attack.total});if(!attack.hit)resolvedDamage=null}if((spell.attackType==="saving-throw"||spell.saveAbility)&&spell.saveAbility){const dice=rollDice({count:spellTargetMode==="normal"?1:2,sides:20,modifier:0});const save=resolveTargetSave(dice.rolls,targetSaveBonus,getSpellSaveDc(activeCharacter),spellTargetMode);const rule=saveDamageRule??getDefaultSaveDamageRule(spell.level,Boolean(spell.damageDice));if(total!==null)resolvedDamage=resolveSaveDamage(total,save.success,rule);resolutionRolls.push({id:dice.id,label:`${spell.name} · ${spell.saveAbility.toUpperCase()} Save · ${save.success?"Başarılı":"Başarısız"}`,notation:`${spellTargetMode} · [${dice.rolls.join(", ")}] ${formatModifier(targetSaveBonus)} vs DC ${getSpellSaveDc(activeCharacter)}`,total:save.total})}if(resolvedDamage!==null)resolutionRolls.push({id:crypto.randomUUID(),label:`${spell.name}${spell.healingDice?" Healing":" Damage"}`,notation:formula!,total:resolvedDamage});if(resolutionRolls.length)setRollHistory(current=>[...resolutionRolls,...current].slice(0,6));setTurnEconomy(current=>spendTurnResource(current,spellTime.includes("bonus")?"bonus-action":spellTime.includes("reaction")?"reaction":"action"));
  }

  function quickRoll(label: string, modifier: number) {
    const result = rollDice({ count: 1, sides: 20, modifier });
    setRollHistory((current) =>
      [
        {
          id: result.id,
          label,
          notation: result.notation,
          total: result.total,
        },
        ...current,
      ].slice(0, 6),
    );
  }

  function resolvedCheck(label:string,modifier:number,kind:"skill"|"save"){const imposed=kind==="skill"?exhaustionEffects.abilityCheckMode:exhaustionEffects.attackSaveMode;const effectiveMode=combineRollModes(checkMode,imposed);const adjustedModifier=modifier-exhaustionEffects.d20Penalty;const dice=rollDice({count:effectiveMode==="normal"?1:2,sides:20,modifier:0});const natural=chooseD20(dice.rolls,effectiveMode);setRollHistory(current=>[{id:dice.id,label,notation:`${effectiveMode} · [${dice.rolls.join(", ")}] ${formatModifier(adjustedModifier)}`,total:natural+adjustedModifier},...current].slice(0,6))}
  function monkAction(name:string,cost:number,resource:"action"|"bonus-action"){if(!isMonk||conditionEffects.blocksActions||(resource==="action"?turnEconomy.actionUsed:turnEconomy.bonusActionUsed)||!focusPoints||focusPoints.max-focusPoints.used<cost)return;const die=getMartialArtsDie(activeCharacter.level,activeCharacter.ruleset);const attack=rollDice({count:1,sides:20,modifier:getAbilityModifier(activeCharacter.abilities.dex)+getProficiencyBonus(activeCharacter.level)});const damage=rollDice({count:1,sides:die,modifier:getAbilityModifier(activeCharacter.abilities.dex)});commit({resources:activeCharacter.resources.map(item=>item.id==="focus-points"?{...item,used:item.used+cost}:item)});setTurnEconomy(current=>spendTurnResource(current,resource));setRollHistory(current=>[{id:attack.id,label:`${name} Attack`,notation:attack.notation,total:attack.total},{id:damage.id,label:`${name} Damage`,notation:damage.notation,total:damage.total},...current].slice(0,6))}
  function grantBardicInspiration(){if(!bardicInspiration||bardicInspiration.used>=bardicInspiration.max||turnEconomy.bonusActionUsed)return;const result=rollDice({count:1,sides:getBardicInspirationDie(activeCharacter.level),modifier:0});commit({resources:activeCharacter.resources.map(item=>item.id==="bardic-inspiration"?{...item,used:item.used+1}:item)});setTurnEconomy(current=>spendTurnResource(current,"bonus-action"));setRollHistory(current=>[{id:result.id,label:"Bardic Inspiration",notation:result.notation,total:result.total},...current].slice(0,6))}
  function useActionSurge(){if(!actionSurge||actionSurge.used>=actionSurge.max)return;commit({resources:activeCharacter.resources.map(item=>item.id==="action-surge"?{...item,used:item.used+1}:item)});setTurnEconomy(current=>({...current,actionUsed:false,attacksUsed:0}))}
  function useIndomitable(){if(!indomitable||indomitable.used>=indomitable.max)return;const bonus=getIndomitableBonus(activeCharacter.level,activeCharacter.ruleset);const result=rollDice({count:1,sides:20,modifier:bonus});commit({resources:activeCharacter.resources.map(item=>item.id==="indomitable"?{...item,used:item.used+1}:item)});setRollHistory(current=>[{id:result.id,label:"Indomitable Save Reroll",notation:result.notation,total:result.total},...current].slice(0,6))}
  function activateChannelDivinity(mode:"turn"|"spark-heal"|"spark-damage"){if(!channelDivinity||channelDivinity.used>=channelDivinity.max||turnEconomy.actionUsed)return;const rolls:RollResult[]=[];if(mode!=="turn"){const result=rollDice({count:getDivineSparkDice(activeCharacter.level),sides:8,modifier:getAbilityModifier(activeCharacter.abilities.wis)});rolls.push({id:result.id,label:mode==="spark-heal"?"Divine Spark Healing":"Divine Spark Radiant Damage",notation:result.notation,total:result.total})}commit({resources:activeCharacter.resources.map(item=>item.id==="channel-divinity"?{...item,used:item.used+1}:item)});setTurnEconomy(current=>spendTurnResource(current,"action"));setRollHistory(current=>[{id:crypto.randomUUID(),label:mode==="turn"?`Turn Undead · WIS Save DC ${getSpellSaveDc(activeCharacter)}`:"Channel Divinity",notation:"Action",total:getSpellSaveDc(activeCharacter)},...rolls,...current].slice(0,6))}
  function createSorcerySlot(level:number){if(!sorceryPoints)return;const slot=spellSlots.find(item=>item.level===level);const remaining=sorceryPoints.max-sorceryPoints.used;if(!slot||!canCreateSorcerySlot(level,remaining,slot.used>0))return;const cost=getSorcerySlotCost(level)!;commit({spellSlots:spellSlots.map(item=>item.level===level?{...item,used:item.used-1}:item),resources:activeCharacter.resources.map(item=>item.id==="sorcery-points"?{...item,used:item.used+cost}:item)})}
  function convertSlotToSorceryPoints(level:number){if(!sorceryPoints)return;const slot=spellSlots.find(item=>item.level===level);const gain=getPointsFromSlot(level);const remaining=sorceryPoints.max-sorceryPoints.used;if(!slot||slot.used>=slot.max||remaining<=0)return;const actual=Math.min(gain,remaining);commit({spellSlots:spellSlots.map(item=>item.level===level?{...item,used:item.used+1}:item),resources:activeCharacter.resources.map(item=>item.id==="sorcery-points"?{...item,used:item.used-actual}:item)})}
  function applyArcaneRecovery(){if(!arcaneRecovery||arcaneRecovery.used>=arcaneRecovery.max||!arcaneRecoveryLevels.length)return;const counts=new Map<number,number>();arcaneRecoveryLevels.forEach(level=>counts.set(level,(counts.get(level)??0)+1));commit({spellSlots:spellSlots.map(slot=>({...slot,used:Math.max(0,slot.used-(counts.get(slot.level)??0))})),resources:activeCharacter.resources.map(item=>item.id==="arcane-recovery"?{...item,used:item.used+1}:item)});setArcaneRecoveryLevels([])}
  function useFavoredEnemy(){if(!favoredEnemy||favoredEnemy.used>=favoredEnemy.max||turnEconomy.bonusActionUsed)return;commit({resources:activeCharacter.resources.map(item=>item.id==="favored-enemy"?{...item,used:item.used+1}:item),conditions:activeCharacter.conditions.includes("Concentration")?activeCharacter.conditions:[...activeCharacter.conditions,"Concentration"]});setTurnEconomy(current=>spendTurnResource(current,"bonus-action"))}

  function weaponAttack(weapon:(typeof equippedItems.weapons)[number]){if(conditionEffects.blocksActions||exhaustionEffects.dead||turnEconomy.actionUsed)return;const conditionMode=combineRollModes(conditionEffects.attackMode,exhaustionEffects.attackSaveMode);const effectiveMode=combineRollModes(attackMode,conditionMode);const modifier=getWeaponAttackBonus(activeCharacter,weapon)-exhaustionEffects.d20Penalty;const dice=rollDice({count:effectiveMode==="normal"?1:2,sides:20,modifier:0});const attack=resolveAttack(dice.rolls,modifier,targetAc,effectiveMode);const results:RollResult[]=[{id:dice.id,label:`${weapon.name} · ${attack.hit?attack.critical?"CRITICAL":"Hit":"Miss"}`,notation:`${effectiveMode} · [${dice.rolls.join(", ")}] ${formatModifier(modifier)} vs AC ${targetAc}`,total:attack.total}];if(attack.hit){const formula=getCriticalDamageFormula(getWeaponDamageSummary(activeCharacter,weapon),attack.critical);if(formula){const damage=rollDice(formula);results.push({id:damage.id,label:`${weapon.name} Damage${attack.critical?" · Critical":""}`,notation:damage.notation,total:damage.total})}const sneakAllowed=isRogue&&sneakAttackEnabled&&canUseSneakAttack({level:activeCharacter.level,weapon,usedThisTurn:sneakAttackUsed,hasAdvantage:effectiveMode==="advantage",hasDisadvantage:effectiveMode==="disadvantage",allyAdjacent:sneakAllyAdjacent});if(sneakAllowed){const sneak=rollDice({count:getSneakAttackDice(activeCharacter.level)*(attack.critical?2:1),sides:6,modifier:0});results.push({id:sneak.id,label:`Sneak Attack${attack.critical?" · Critical":""}`,notation:sneak.notation,total:sneak.total});setSneakAttackUsed(true)}}setTurnEconomy(current=>spendAttack(current,attacksPerAction));setRollHistory(current=>[...results,...current].slice(0,6))}

  function shortRest(die: number) {
    const pool = hitDice.find((item) => item.die === die);
    if (!pool || pool.used >= pool.max) return;

    const result = rollDice({
      count: 1,
      sides: die,
      modifier: getAbilityModifier(activeCharacter.abilities.con),
    });

    commit({
      currentHp: Math.min(
        activeCharacter.maxHp,
        activeCharacter.currentHp + Math.max(0, result.total),
      ),
      hitDice: hitDice.map((item) =>
        item.die === die ? { ...item, used: item.used + 1 } : item,
      ),
      resources: activeCharacter.resources.map(resource=>resource.recovery==="short"?{...resource,used:0}:resource),
      spellSlots: activeCharacter.className.trim().toLowerCase()==="warlock"?resetSpellSlots(spellSlots):spellSlots,
    });

    setRollHistory((current) =>
      [
        {
          id: result.id,
          label: `Short Rest d${die}`,
          notation: result.notation,
          total: Math.max(0, result.total),
        },
        ...current,
      ].slice(0, 6),
    );
  }

  function longRest() {
    commit({
      currentHp: activeCharacter.maxHp,
      tempHp: 0,
      spellSlots: resetSpellSlots(spellSlots),
      hitDice: resetHitDice(hitDice),
      deathSaves: resetDeathSaves(),
      exhaustion: Math.max(0, (activeCharacter.exhaustion ?? 0) - 1),
      conditionDurations: {},
      conditions: activeCharacter.conditions.filter((item) => item === "Cursed"),
      resources: activeCharacter.resources.map(resource=>({...resource,used:0})),
      usedArcanumSpellIds: [],
      activeSpellEffects: [],
    });
    setLuckyUsed(0);
  }

  const hpPercent = Math.max(
    0,
    Math.min(100, (activeCharacter.currentHp / activeCharacter.maxHp) * 100),
  );

  return (
    <PageShell
      eyebrow="Table Mode"
      title="Play Mode"
      description="Masada lazım olan şeyler. Geri kalanı karakter sayfasında usulca bekliyor."
    >
      <div className={`play-mode-v1 ${isFocusMode ? "focus-mode" : ""}`}>
        <header className="play-mode-toolbar">
          <label>
            Aktif karakter
            <select
              value={activeCharacter.id}
              onChange={(event) => {
                setSelectedCharacterId(event.target.value);
                setSearchParams({ character: event.target.value }, { replace: true });
              }}
            >
              {characters.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · Lv. {item.level} {item.className}
                </option>
              ))}
            </select>
          </label>

          <button onClick={() => setIsFocusMode((current) => !current)}>
            {isFocusMode ? "Normal Görünüm" : "Odak Modu"}
          </button>
        </header>

        <section className={`play-readiness-card ${readiness.status}`}>
          <div>
            <span className="mini-label">Playable Character Check</span>
            <strong>{readiness.status === "ready" ? "Karakter masaya hazır" : `Hazırlık skoru: ${readiness.score}%`}</strong>
            <p>{readiness.status === "ready" ? "HP, temel seçimler, büyüler ve ekipman bağlantıları oynanabilir durumda." : readiness.issues.filter((issue) => issue.severity === "error").map((issue) => issue.message).join(" ")}</p>
          </div>
          <div className="play-readiness-actions">
            {readiness.issues.filter((issue) => issue.severity === "warning").length ? <span>{readiness.issues.filter((issue) => issue.severity === "warning").length} öneri</span> : null}
            <NavLink to={`/characters/${activeCharacter.id}/edit`}>{readiness.status === "ready" ? "Karakteri düzenle" : "Eksikleri düzelt"}</NavLink>
          </div>
        </section>

        <section className="play-mode-hero">
          <div>
            <span className="mini-label">{activeCharacter.playerName || "Player"}</span>
            <h2>{activeCharacter.name}</h2>
            <p>
              Level {activeCharacter.level} {activeCharacter.race} {activeCharacter.className}
            </p>
          </div>

          <div className="play-mode-core-stats">
            <div><span>AC</span><strong>{armorClass}</strong></div>
            <div><span>Init</span><strong>{formatModifier(getInitiative(activeCharacter)+featRuntime.alertInitiativeBonus)}</strong></div>
            <div><span>Prof</span><strong>+{getProficiencyBonus(activeCharacter.level)}</strong></div>
            <div><span>Save DC</span><strong>{getSpellSaveDc(activeCharacter)}</strong></div>
            <div><span>Spell Atk</span><strong>{formatModifier(getSpellAttackBonus(activeCharacter))}</strong></div>
          </div>
        </section>

        <div className="play-mode-grid">
          <section className="play-mode-card turn-economy-card"><div className="play-mode-section-head"><div><span className="mini-label">Current Turn</span><h2>Action Economy</h2></div><button type="button" onClick={()=>{setTurnEconomy(createTurnEconomy());setSneakAttackUsed(false)}}>Yeni Tur</button></div><div className="turn-resource-grid"><button className={turnEconomy.actionUsed?"spent":""} onClick={()=>setTurnEconomy(current=>spendTurnResource(current,"action"))}>Action <small>{turnEconomy.actionUsed?"Kullanıldı":"Hazır"}</small></button><button className={turnEconomy.bonusActionUsed?"spent":""} onClick={()=>setTurnEconomy(current=>spendTurnResource(current,"bonus-action"))}>Bonus Action <small>{turnEconomy.bonusActionUsed?"Kullanıldı":"Hazır"}</small></button><button className={turnEconomy.reactionUsed?"spent":""} onClick={()=>setTurnEconomy(current=>spendTurnResource(current,"reaction"))}>Reaction <small>{turnEconomy.reactionUsed?"Kullanıldı":"Hazır"}</small></button></div><div className="movement-console"><span>Movement {turnEconomy.movementUsed} / {effectiveSpeed} ft.</span>{[5,10,15].map(feet=><button type="button" key={feet} disabled={turnEconomy.movementUsed>=effectiveSpeed} onClick={()=>setTurnEconomy(current=>spendMovement(current,feet,effectiveSpeed))}>+{feet}</button>)}</div><small>Attack {turnEconomy.attacksUsed} / {attacksPerAction} · Spell casting time action kaynağını otomatik harcar.</small></section>
          {isRogue?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Rogue Combat</span><h2>Sneak Attack · {getSneakAttackDice(activeCharacter.level)}d6</h2></div><strong>{sneakAttackUsed?"Bu tur kullanıldı":"Hazır"}</strong></div><div className="rogue-toggle-grid"><label><input type="checkbox" checked={sneakAttackEnabled} onChange={event=>setSneakAttackEnabled(event.target.checked)}/> İsabette uygula</label><label><input type="checkbox" checked={sneakAllyAdjacent} onChange={event=>setSneakAllyAdjacent(event.target.checked)}/> Hedefin yanında müttefik var</label></div>{rogueFeatures.cunningAction?<div className="play-mode-big-buttons">{["Dash","Disengage","Hide"].map(action=><button type="button" key={action} disabled={turnEconomy.bonusActionUsed} onClick={()=>setTurnEconomy(current=>spendTurnResource(current,"bonus-action"))}>{action}</button>)}</div>:null}<div className="condition-rule-summary">{rogueFeatures.uncannyDodge?<small>Uncanny Dodge: görülen saldırıya Reaction ile yarım hasar.</small>:null}{rogueFeatures.evasion?<small>Evasion: DEX save hasarı başarıda 0, başarısızlıkta yarım.</small>:null}{rogueFeatures.reliableTalent?<small>Reliable Talent: proficient check d20 sonucu minimum 10.</small>:null}{rogueFeatures.elusive?<small>Elusive: incapacitated değilken saldırılar sana advantage alamaz.</small>:null}</div></section>:null}
          {isBarbarian?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Barbarian Combat</span><h2>Rage · +{getRageDamageBonus(activeCharacter.level)} damage</h2></div><strong>{isRaging?"Raging":"Hazır değil"}</strong></div><div className="rogue-toggle-grid"><label><input type="checkbox" checked={recklessAttack} disabled={!barbarianFeatures.recklessAttack} onChange={event=>setRecklessAttack(event.target.checked)}/> Reckless Attack</label><span>Brutal Critical +{getBrutalCriticalExtraDice(activeCharacter.level,activeCharacter.ruleset)} die</span></div><div className="condition-rule-summary"><small>STR melee uygun silah: {equippedItems.weapons.some(isRageDamageWeapon)?"var":"yok"}</small>{barbarianFeatures.dangerSense?<small>Danger Sense: görülen DEX save tehlikelerine advantage.</small>:null}{barbarianFeatures.relentlessRage?<small>Relentless Rage: 0 HP yerine CON save.</small>:null}{barbarianFeatures.persistentRage?<small>Persistent Rage etkin.</small>:null}</div></section>:null}
          {isMonk?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Monk Combat</span><h2>Martial Arts · d{getMartialArtsDie(activeCharacter.level,activeCharacter.ruleset)}</h2></div><strong>{focusPoints?`${focusPoints.max-focusPoints.used} / ${focusPoints.max} ${activeCharacter.ruleset==="dnd_2024"?"Focus":"Ki"}`:"Kaynak yok"}</strong></div><div className="play-mode-big-buttons"><button type="button" disabled={turnEconomy.actionUsed} onClick={()=>monkAction("Unarmed Strike",0,"action")}>Unarmed Strike</button>{monkFeatures.flurry?<button type="button" disabled={turnEconomy.bonusActionUsed||!focusPoints||focusPoints.used>=focusPoints.max} onClick={()=>monkAction("Flurry of Blows",1,"bonus-action")}>Flurry · 1</button>:null}{monkFeatures.patientDefense?<button type="button" disabled={turnEconomy.bonusActionUsed||!focusPoints||focusPoints.used>=focusPoints.max} onClick={()=>monkAction("Patient Defense",1,"bonus-action")}>Patient Defense · 1</button>:null}{monkFeatures.stepOfWind?<button type="button" disabled={turnEconomy.bonusActionUsed||!focusPoints||focusPoints.used>=focusPoints.max} onClick={()=>monkAction("Step of the Wind",1,"bonus-action")}>Step of Wind · 1</button>:null}</div><div className="condition-rule-summary"><small>Unarmored Movement +{getUnarmoredMovementBonus(activeCharacter.level)} ft.</small>{monkFeatures.deflectAttacks?<small>Deflect Attacks aktif.</small>:null}{monkFeatures.stunningStrike?<small>Stunning Strike: isabette 1 Focus/Ki.</small>:null}{monkFeatures.evasion?<small>Evasion aktif.</small>:null}{monkFeatures.diamondSoul?<small>Diamond Soul / Disciplined Survivor aktif.</small>:null}</div></section>:null}
          {isBard?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Bard Support</span><h2>Bardic Inspiration · d{getBardicInspirationDie(activeCharacter.level)}</h2></div><strong>{bardicInspiration?`${bardicInspiration.max-bardicInspiration.used} / ${bardicInspiration.max} kaldı`:"Kaynak yok"}</strong></div><button type="button" disabled={!bardicInspiration||bardicInspiration.used>=bardicInspiration.max||turnEconomy.bonusActionUsed} onClick={grantBardicInspiration}>Inspiration Ver · Bonus Action</button><div className="condition-rule-summary"><small>Recovery: {getInspirationRecovery(activeCharacter.level)} rest</small>{bardFeatures.songOfRest?<small>Song of Rest +d{bardFeatures.songOfRest}</small>:null}{bardFeatures.fontOfInspiration?<small>Font of Inspiration aktif.</small>:null}{bardFeatures.countercharm?<small>Countercharm aktif.</small>:null}{bardFeatures.magicalSecrets?<small>Magical Secrets aktif.</small>:null}{bardFeatures.superiorInspiration?<small>Superior Inspiration aktif.</small>:null}</div></section>:null}
          {isFighter?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Fighter Combat</span><h2>{fighterFeatures.extraAttack} Attack / Action</h2></div></div><div className="play-mode-big-buttons"><button type="button" disabled={!secondWind||secondWind.used>=secondWind.max||turnEconomy.bonusActionUsed} onClick={()=>{executeClassAction("second-wind");setTurnEconomy(current=>spendTurnResource(current,"bonus-action"))}}>Second Wind</button>{fighterFeatures.actionSurge?<button type="button" disabled={!actionSurge||actionSurge.used>=actionSurge.max} onClick={useActionSurge}>Action Surge</button>:null}{fighterFeatures.indomitable?<button type="button" disabled={!indomitable||indomitable.used>=indomitable.max} onClick={useIndomitable}>Indomitable</button>:null}</div><div className="condition-rule-summary">{fighterFeatures.tacticalMind?<small>Tactical Mind aktif.</small>:null}{fighterFeatures.tacticalMaster?<small>Tactical Master aktif.</small>:null}{fighterFeatures.studiedAttacks?<small>Studied Attacks aktif.</small>:null}</div></section>:null}
          {isCleric&&clericFeatures.channelDivinity?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Cleric Divinity</span><h2>Channel Divinity</h2></div><strong>{channelDivinity?`${channelDivinity.max-channelDivinity.used} / ${channelDivinity.max} kaldı`:"Kaynak yok"}</strong></div><div className="play-mode-big-buttons"><button type="button" disabled={!channelDivinity||channelDivinity.used>=channelDivinity.max||turnEconomy.actionUsed} onClick={()=>activateChannelDivinity("turn")}>Turn Undead</button>{clericFeatures.divineSpark?<><button type="button" disabled={!channelDivinity||channelDivinity.used>=channelDivinity.max||turnEconomy.actionUsed} onClick={()=>activateChannelDivinity("spark-heal")}>Divine Spark Heal</button><button type="button" disabled={!channelDivinity||channelDivinity.used>=channelDivinity.max||turnEconomy.actionUsed} onClick={()=>activateChannelDivinity("spark-damage")}>Divine Spark Damage</button></>:null}</div><div className="condition-rule-summary">{clericFeatures.destroyUndead?<small>Destroy Undead: CR {clericFeatures.destroyUndead} ve altı.</small>:null}{clericFeatures.blessedStrikes?<small>Blessed Strikes / Divine Strike progression aktif.</small>:null}{clericFeatures.divineIntervention?<small>Divine Intervention aktif.</small>:null}{clericFeatures.greaterDivineIntervention?<small>Greater Divine Intervention aktif.</small>:null}</div></section>:null}
          {isSorcerer&&sorcererFeatures.fontOfMagic?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Sorcerer</span><h2>Font of Magic</h2></div><strong>{sorceryPoints?`${sorceryPoints.max-sorceryPoints.used} / ${sorceryPoints.max} SP`:"Kaynak yok"}</strong></div><div className="play-mode-slot-grid">{spellSlots.filter(slot=>slot.level<=5).map(slot=>{const remaining=sorceryPoints?sorceryPoints.max-sorceryPoints.used:0;const cost=getSorcerySlotCost(slot.level)!;return <div className="play-mode-slot-row" key={slot.level}><div><span>Level {slot.level} Slot</span><small>{slot.max-slot.used}/{slot.max} hazır · Create {cost} SP · Convert +{slot.level} SP</small></div><div><button type="button" disabled={!sorceryPoints||!canCreateSorcerySlot(slot.level,remaining,slot.used>0)} onClick={()=>createSorcerySlot(slot.level)}>Slot Yarat</button><button type="button" disabled={!sorceryPoints||slot.used>=slot.max||remaining<=0} onClick={()=>convertSlotToSorceryPoints(slot.level)}>SP'ye Çevir</button></div></div>})}</div>{sorcererFeatures.sorcerousRestoration?<div className="condition-rule-summary"><small>Sorcerous Restoration aktif.</small></div>:null}</section>:null}
          {isWizard&&wizardFeatures.arcaneRecovery?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Wizard</span><h2>Arcane Recovery</h2></div><strong>{getArcaneRecoveryBudget(activeCharacter.level)-arcaneRecoveryLevels.reduce((sum,level)=>sum+level,0)} level bütçe</strong></div><div className="play-mode-slot-grid">{spellSlots.filter(slot=>slot.level<=5).map(slot=>{const selected=arcaneRecoveryLevels.filter(level=>level===slot.level).length;const remaining=getArcaneRecoveryBudget(activeCharacter.level)-arcaneRecoveryLevels.reduce((sum,level)=>sum+level,0);return <div className="play-mode-slot-row" key={slot.level}><div><span>Level {slot.level}</span><small>{slot.used} harcanmış · {selected} seçili</small></div><div><button type="button" disabled={!selected} onClick={()=>{const index=arcaneRecoveryLevels.indexOf(slot.level);setArcaneRecoveryLevels(current=>current.filter((_,i)=>i!==index))}}>−</button><button type="button" disabled={!arcaneRecovery||arcaneRecovery.used>=arcaneRecovery.max||!canRecoverWizardSlot(slot.level,slot.used-selected,remaining)} onClick={()=>setArcaneRecoveryLevels(current=>[...current,slot.level])}>+</button></div></div>})}</div><button type="button" disabled={!arcaneRecoveryLevels.length||!arcaneRecovery||arcaneRecovery.used>=arcaneRecovery.max} onClick={applyArcaneRecovery}>Seçili Slotları Yenile</button><div className="condition-rule-summary">{wizardFeatures.memorizeSpell?<small>Memorize Spell aktif.</small>:null}{wizardFeatures.spellMastery?<small>Spell Mastery aktif.</small>:null}{wizardFeatures.signatureSpells?<small>Signature Spells aktif.</small>:null}</div></section>:null}
          {isRanger?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Ranger Hunt</span><h2>Hunter's Mark · {getHuntersMarkDamage(activeCharacter.level)}</h2></div><strong>{favoredEnemy?`${favoredEnemy.max-favoredEnemy.used}/${favoredEnemy.max} ücretsiz`:activeCharacter.ruleset==="dnd_2014"?"Spell slot kullanır":"Kaynak yok"}</strong></div>{rangerFeatures.favoredEnemy?<button type="button" disabled={!favoredEnemy||favoredEnemy.used>=favoredEnemy.max||turnEconomy.bonusActionUsed} onClick={useFavoredEnemy}>Favored Enemy · Bonus Action</button>:null}<div className="condition-rule-summary">{rangerFeatures.deftExplorer?<small>Deft Explorer aktif.</small>:null}{rangerFeatures.extraAttack?<small>Extra Attack aktif.</small>:null}{rangerFeatures.roving?<small>Roving aktif.</small>:null}{rangerFeatures.tireless?<small>Tireless aktif.</small>:null}{rangerFeatures.naturesVeil?<small>Nature's Veil aktif.</small>:null}{rangerFeatures.foeSlayer?<small>Foe Slayer aktif.</small>:null}</div></section>:null}
          {featNames.some(name=>["alert","lucky","tough","mobile","observant"].includes(name.toLowerCase()))?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Feat Runtime</span><h2>Aktif Feat Etkileri</h2></div></div><div className="condition-rule-summary">{featRuntime.alertInitiativeBonus?<small>Alert: Initiative +{featRuntime.alertInitiativeBonus}</small>:null}{featRuntime.speedBonus?<small>Mobile: Speed +{featRuntime.speedBonus} ft.</small>:null}{featRuntime.toughHpBonus?<small>Tough: Max HP katkısı +{featRuntime.toughHpBonus}</small>:null}{featRuntime.passivePerceptionBonus?<small>Observant: Passive Perception/Investigation +5</small>:null}</div>{featRuntime.luckyUses?<button type="button" disabled={luckyUsed>=featRuntime.luckyUses} onClick={()=>setLuckyUsed(value=>value+1)}>Lucky Kullan · {featRuntime.luckyUses-luckyUsed}/{featRuntime.luckyUses}</button>:null}</section>:null}
          <section className="play-mode-card play-mode-hp-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Hit Points</span><h2>Can Yönetimi</h2></div>
              <strong className="play-mode-hp-number">{activeCharacter.currentHp} / {activeCharacter.maxHp}</strong>
            </div>

            <div className="play-mode-hp-bar"><span style={{ width: `${hpPercent}%` }} /></div>

            <div className="play-mode-big-buttons">
              {[-10, -5, -1, 1, 5, 10].map((amount) => (
                <button key={amount} onClick={() => updateHp(amount)}>
                  {amount > 0 ? `+${amount}` : amount}
                </button>
              ))}
            </div>

            <div className="survival-console">
              <input type="number" min="1" value={survivalAmount} onChange={event=>setSurvivalAmount(Math.max(1,Number(event.target.value)||1))}/>
              <button type="button" onClick={()=>takeDamage(false)}>Hasar Al</button>
              <button type="button" onClick={()=>takeDamage(true)}>Kritik Hasar</button>
              <button type="button" onClick={healDamage}>İyileştir</button>
            </div>
            {isBarbarian?<label className="rage-resistance-toggle"><input type="checkbox" checked={incomingPhysical} onChange={event=>setIncomingPhysical(event.target.checked)}/> Gelen hasar fiziksel</label>:null}
            {pendingConcentrationDc?<button type="button" className="concentration-prompt" onClick={()=>concentrationSave(pendingConcentrationDc)}>Concentration Save At · DC {pendingConcentrationDc}</button>:null}
            {activeCharacter.currentHp===0?<div className="death-save-console"><strong>Death Saves · ✓ {activeCharacter.deathSaves.successes}/3 · ✕ {activeCharacter.deathSaves.failures}/3</strong><button type="button" disabled={activeCharacter.deathSaves.successes>=3||activeCharacter.deathSaves.failures>=3} onClick={rollDeathSave}>Death Save At</button></div>:null}

            <label className="play-mode-temp-hp">
              Temp HP
              <input
                type="number"
                min="0"
                value={activeCharacter.tempHp}
                onChange={(event) => commit({ tempHp: Math.max(0, Number(event.target.value)) })}
              />
            </label>
          </section>

          <section className="play-mode-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Conditions</span><h2>Durumlar</h2></div>
              <span>{activeCharacter.conditions.length} aktif</span>
            </div>

            <div className="play-mode-condition-grid">
              {conditionOptions.map((condition) => (
                <button
                  className={activeCharacter.conditions.includes(condition) ? "active" : ""}
                  key={condition}
                  onClick={() => toggleCondition(condition)}
                >
                  {condition}
                </button>
              ))}
            </div>
            {conditionEffects.notes.length?<div className="condition-rule-summary">{conditionEffects.notes.map(note=><small key={note}>{note}</small>)}</div>:null}
            <div className="exhaustion-console"><div><span className="mini-label">Exhaustion</span><strong>{exhaustionEffects.level} / 6</strong><small>{activeCharacter.ruleset==="dnd_2024"?`D20 -${exhaustionEffects.d20Penalty} · Speed ${effectiveSpeed} ft.`:`Speed ${effectiveSpeed} ft. · Effective Max HP ${effectiveMaxHp}`}</small>{exhaustionEffects.dead?<em>Level 6 · Ölü</em>:null}</div><div><button type="button" disabled={exhaustionEffects.level<=0} onClick={()=>commit({exhaustion:exhaustionEffects.level-1})}>−</button><button type="button" disabled={exhaustionEffects.level>=6} onClick={()=>commit({exhaustion:exhaustionEffects.level+1})}>+</button></div></div>
          </section>

          {metamagicOptions.length ? (
            <section className="play-mode-card">
              <div className="play-mode-section-head">
                <div><span className="mini-label">Sorcerer</span><h2>Metamagic</h2></div>
                <strong>{sorceryPoints ? `${sorceryPoints.max - sorceryPoints.used} / ${sorceryPoints.max} SP` : "SP yok"}</strong>
              </div>

              <div className="play-mode-slot-grid">
                {metamagicOptions.map((option) => (
                  <div className="play-mode-slot-row" key={option.id}>
                    <div><span>{option.name}</span><small>{option.summary}</small></div>
                    <button
                      type="button"
                      disabled={!sorceryPoints || sorceryPoints.max - sorceryPoints.used < option.cost}
                      onClick={() => spendSorceryPoints(option.cost)}
                    >
                      Kullan · {option.cost} SP
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {invocations.length ? (
            <section className="play-mode-card">
              <div className="play-mode-section-head">
                <div><span className="mini-label">Warlock</span><h2>Eldritch Invocations</h2></div>
                <strong>{invocations.length} aktif</strong>
              </div>
              <div className="play-mode-slot-grid">
                {invocations.map((option) => <div className="play-mode-slot-row" key={option.id}><div><span>{option.name}</span><small>{option.summary}</small></div></div>)}
              </div>
            </section>
          ) : null}

          {wildShapeForms.length ? <section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Druid</span><h2>Wild Shape</h2></div><strong>{wildShapeResource?`${wildShapeResource.max-wildShapeResource.used} / ${wildShapeResource.max} kullanım`:"Kaynak yok"}</strong></div><div className="play-mode-slot-grid">{wildShapeForms.map(form=><div className="play-mode-slot-row" key={form.id}><div><span>{form.name} · CR {form.challengeRating}</span><small>AC {form.armorClass} · HP {form.hitPoints} · {form.movement}</small></div><button type="button" disabled={!wildShapeResource||wildShapeResource.used>=wildShapeResource.max} onClick={useWildShape}>Dönüş</button></div>)}</div></section>:null}

          {maneuvers.length?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Battle Master · {getSuperiorityDie(activeCharacter.level)}</span><h2>Maneuvers</h2></div><strong>{superiorityDice?`${superiorityDice.max-superiorityDice.used} / ${superiorityDice.max} zar`:"Kaynak yok"}</strong></div><div className="play-mode-slot-grid">{maneuvers.map(option=><div className="play-mode-slot-row" key={option.id}><div><span>{option.name}</span><small>{option.trigger} · {option.summary}</small></div><button type="button" disabled={!superiorityDice||superiorityDice.used>=superiorityDice.max} onClick={useSuperiorityDie}>Zar Harca</button></div>)}</div></section>:null}

          {companion&&companionStats?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Beast Master Companion</span><h2>{companion.name}</h2></div><strong>{companionCurrentHp} / {companionStats.maxHp} HP</strong></div><p>{companion.summary}</p><div className="play-mode-core-stats"><div><span>AC</span><strong>{companionStats.armorClass}</strong></div><div><span>Attack</span><strong>{formatModifier(companionStats.attackBonus)}</strong></div><div><span>Damage</span><strong>{companionStats.damage}</strong></div></div><div className="play-mode-big-buttons">{[-5,-1,1,5].map(amount=><button key={amount} onClick={()=>updateCompanionHp(amount)}>{amount>0?`+${amount}`:amount}</button>)}</div><small>{companion.attackName} · {companion.speed}</small></section>:null}

          {classActions.length?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Core Class Actions</span><h2>{activeCharacter.className} Kaynakları</h2></div></div><div className="play-mode-slot-grid">{classActions.map(action=>{const resourceId=action.resourceId!;const resource=activeCharacter.resources.find(item=>item.id===resourceId)!;const remaining=resource.max-resource.used;return <div className="play-mode-slot-row" key={action.id}><div><span>{action.name} · {action.actionType}</span><small>{action.summary}</small><strong>{remaining} / {resource.max} kaldı · {resource.recovery} rest</strong></div>{resourceId==="lay-on-hands"?<div>{[1,5,10].map(amount=><button key={amount} disabled={remaining<amount} onClick={()=>executeClassAction(resourceId,amount)}>+{amount} HP</button>)}</div>:<button type="button" disabled={remaining<1} onClick={()=>executeClassAction(resourceId)}>{resourceId==="second-wind"?"İyileş":"Kullan"}</button>}</div>})}</div></section>:null}

          {arcanumSpells.length?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Warlock · Long Rest</span><h2>Mystic Arcanum</h2></div><strong>{arcanumSpells.length-(activeCharacter.usedArcanumSpellIds??[]).length} hazır</strong></div><div className="play-mode-spell-list">{arcanumSpells.sort((a,b)=>a.level-b.level).map(spell=>{const used=activeCharacter.usedArcanumSpellIds?.includes(spell.id);return <button key={spell.id} disabled={used} onClick={()=>castArcanum(spell.id)}><span>Level {spell.level} · {spell.name}</span><small>{used?"Kullanıldı":"Arcanum Kullan"}</small></button>})}</div></section>:null}

          {isPaladin(activeCharacter.className)&&activeCharacter.level>=2?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Paladin Combat</span><h2>Divine Smite</h2></div><label><input type="checkbox" checked={smiteHolyTarget} onChange={event=>setSmiteHolyTarget(event.target.checked)}/> Fiend / Undead</label></div><div className="play-mode-slot-grid">{spellSlots.map(slot=>{const dice=getDivineSmiteDice(slot.level,activeCharacter.ruleset,smiteHolyTarget);return <div className="play-mode-slot-row" key={slot.level}><div><span>Level {slot.level} Slot · {dice}d8 radiant</span><small>{slot.max-slot.used} / {slot.max} slot kaldı</small></div><button type="button" disabled={slot.used>=slot.max} onClick={()=>divineSmite(slot.level)}>Smite At</button></div>})}</div>{paladinAuras?<div className="play-mode-slot-grid">{paladinAuras.protection?<div className="play-mode-slot-row"><div><span>Aura of Protection · {paladinAuras.protection.radius} ft.</span><small>{paladinAuras.protection.summary}</small></div></div>:null}{paladinAuras.courage?<div className="play-mode-slot-row"><div><span>Aura of Courage · {paladinAuras.courage.radius} ft.</span><small>{paladinAuras.courage.summary}</small></div></div>:null}{paladinAuras.radiantStrikes?<div className="play-mode-slot-row"><div><span>Radiant Strikes</span><small>{paladinAuras.radiantStrikes}</small></div></div>:null}</div>:null}</section>:null}

          {activeSpellEffects.length?<section className="play-mode-card"><div className="play-mode-section-head"><div><span className="mini-label">Persistent Magic</span><h2>Aktif Spell Etkileri</h2></div><button type="button" onClick={advanceEffectRound}>1 Round İlerle</button></div><div className="play-mode-slot-grid">{activeSpellEffects.map(effect=><div className="play-mode-slot-row" key={effect.id}><div><span>{effect.name}{effect.concentration?" · Concentration":""}</span><small>{effect.remainingRounds===null?"Süresiz":`${effect.remainingRounds} round kaldı`} · {effect.summary}</small></div><button type="button" onClick={()=>endSpellEffect(effect.id)}>Bitir</button></div>)}</div>{activeSpellEffects.some(effect=>effect.concentration)?<div className="play-mode-big-buttons"><span>Concentration save:</span>{[10,15,20].map(dc=><button type="button" key={dc} onClick={()=>concentrationSave(dc)}>DC {dc}</button>)}</div>:null}</section>:null}

          <section className="play-mode-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Spell Slots</span><h2>Kaynaklar</h2></div>
              <button onClick={() => commit({ spellSlots: resetSpellSlots(spellSlots) })}>Slotları Yenile</button>
            </div>

            <div className="play-mode-slot-grid">
              {spellSlots.length === 0 ? (
                <p>Spell slot yok. Bazen sorun büyü değil, sınıf seçimidir.</p>
              ) : spellSlots.map((slot) => (
                <div className="play-mode-slot-row" key={slot.level}>
                  <div><span>Level {slot.level}</span><strong>{slot.max - slot.used} / {slot.max}</strong></div>
                  <div>
                    <button onClick={() => spendSlot(slot.level, 1)} disabled={slot.used >= slot.max}>−</button>
                    <button onClick={() => spendSlot(slot.level, -1)} disabled={slot.used <= 0}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="play-mode-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Quick Rolls</span><h2>Hızlı Zarlar</h2></div>
            </div>

            <div className="play-mode-roll-grid">
              {(Object.keys(abilityLabels) as AbilityKey[]).map((ability) => (
                <button
                  key={ability}
                  onClick={() => quickRoll(
                    abilityLabels[ability],
                    getAbilityModifier(activeCharacter.abilities[ability]),
                  )}
                >
                  {abilityLabels[ability]}
                  <span>{formatModifier(getAbilityModifier(activeCharacter.abilities[ability]))}</span>
                </button>
              ))}
            </div>

            <div className="attack-control-bar">
              <label>Hedef AC<input type="number" min="1" value={targetAc} onChange={event=>setTargetAc(Math.max(1,Number(event.target.value)||1))}/></label>
              <label>Atış<select value={attackMode} onChange={event=>setAttackMode(event.target.value as RollMode)}><option value="normal">Normal</option><option value="advantage">Advantage</option><option value="disadvantage">Disadvantage</option></select></label>
            </div>

            {equippedItems.weapons.map((weapon) => (
              <button
                className="play-mode-weapon-roll"
                key={weapon.id}
                disabled={conditionEffects.blocksActions||exhaustionEffects.dead||turnEconomy.actionUsed}
                onClick={() => weaponAttack(weapon)}
              >
                <span>{weapon.name}</span>
                <strong>{formatModifier(getWeaponAttackBonus(activeCharacter, weapon))}</strong>
                <small>{getWeaponDamageSummary(activeCharacter, weapon)}</small>
              </button>
            ))}

            <div className="play-mode-roll-history">
              {rollHistory.length === 0 ? <p>Henüz zar atılmadı.</p> : rollHistory.map((roll) => (
                <div key={roll.id}><span>{roll.label}<small>{roll.notation}</small></span><strong>{roll.total}</strong></div>
              ))}
            </div>
          </section>

          <section className="play-mode-card">
            <div className="play-mode-section-head"><div><span className="mini-label">Checks & Saves</span><h2>Skill ve Saving Throws</h2></div><select value={checkMode} onChange={event=>setCheckMode(event.target.value as RollMode)}><option value="normal">Normal</option><option value="advantage">Advantage</option><option value="disadvantage">Disadvantage</option></select></div>
            <div className="save-roll-grid">{(Object.keys(abilityLabels) as AbilityKey[]).map(ability=>{const bonus=getSavingThrowBonus(activeCharacter,ability,rulesetData);return <button type="button" disabled={exhaustionEffects.dead} key={ability} onClick={()=>resolvedCheck(`${abilityLabels[ability]} Saving Throw`,bonus,"save")}><span>{abilityLabels[ability]} Save</span><strong>{formatModifier(bonus-exhaustionEffects.d20Penalty)}</strong></button>})}</div>
            <div className="skill-roll-grid">{Object.keys(SKILL_ABILITIES).map(skill=>{const bonus=getSkillBonus(activeCharacter,skill);const expertise=activeCharacter.expertiseSkills.includes(skill);const proficient=activeCharacter.skillProficiencies.includes(skill);return <button type="button" disabled={exhaustionEffects.dead} key={skill} onClick={()=>resolvedCheck(`${skill} Check`,bonus,"skill")}><span>{skill}<small>{expertise?"Expertise":proficient?"Proficient":activeCharacter.className.toLowerCase()==="bard"&&activeCharacter.level>=2?"Jack of All Trades":"Untrained"}</small></span><strong>{formatModifier(bonus-exhaustionEffects.d20Penalty)}</strong></button>})}</div>
          </section>

          <section className="play-mode-card play-mode-spell-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Prepared Spells</span><h2>Hızlı Büyüler</h2></div>
              <span>{spells.length} hazır</span>
            </div>

            <div className="spell-target-console"><label>Hedef modu<select value={spellTargetMode} onChange={event=>setSpellTargetMode(event.target.value as RollMode)}><option value="normal">Normal</option><option value="advantage">Advantage</option><option value="disadvantage">Disadvantage</option></select></label><label>Hedef save bonus<input type="number" value={targetSaveBonus} onChange={event=>setTargetSaveBonus(Number(event.target.value)||0)}/></label><label>Başarılı save<select value={saveDamageRule} onChange={event=>setSaveDamageRule(event.target.value as SaveDamageRule)}><option value="half">Yarım hasar</option><option value="none">Hasar yok</option></select></label><small>Spell attack büyüleri Quick Rolls bölümündeki hedef AC değerini kullanır.</small></div>

            <div className="play-mode-spell-list">
              {spellGroups.length === 0 ? <p>Hazır büyü bulunamadı.</p> : spellGroups.map((group) => (
                <div key={group.level} className="play-mode-spell-group">
                  <strong>{group.level === 0 ? "Cantrips" : `Level ${group.level}`}</strong>
                  {group.spells.map((spell) => {
                    const castableLevels=getCastableSlotLevels(spell,spellSlots);const selectedSlot=castSlotLevels[spell.id]&&castableLevels.includes(castSlotLevels[spell.id])?castSlotLevels[spell.id]:castableLevels[0];
                    const disabled = spell.level > 0 && !selectedSlot;const formula=getSpellRollFormula(spell,activeCharacter.level,selectedSlot??spell.level);
                    return (
                      <div className="play-mode-slot-row" key={spell.id}><div><span>{spell.name}{spell.concentration ? " · C" : ""}</span><small>{[formula,spell.attackType==="saving-throw"&&spell.saveAbility?`${spell.saveAbility.toUpperCase()} save DC ${getSpellSaveDc(activeCharacter)}`:spell.attackType==="spell-attack"?`Spell attack ${formatModifier(getSpellAttackBonus(activeCharacter))}`:null].filter(Boolean).join(" · ")||"Utility"}</small></div>{spell.level>0?<select aria-label={`${spell.name} slot level`} disabled={!castableLevels.length} value={selectedSlot??""} onChange={event=>setCastSlotLevels(current=>({...current,[spell.id]:Number(event.target.value)}))}>{castableLevels.map(level=><option key={level} value={level}>L{level} slot</option>)}</select>:null}<button disabled={disabled} onClick={()=>castSpell(spell.id,selectedSlot)}>{spell.level===0?"Cantrip":disabled?"Slot yok":"Cast"}</button></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="play-mode-card play-mode-rest-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Rest</span><h2>Dinlenme</h2></div>
            </div>

            <div className="play-mode-rest-actions">
              {hitDice.map((pool) => (
                <button key={pool.die} disabled={pool.used >= pool.max} onClick={() => shortRest(pool.die)}>
                  Short Rest d{pool.die}
                  <small>{pool.max - pool.used} / {pool.max} kaldı</small>
                </button>
              ))}
              <button className="primary-action" onClick={longRest}>Long Rest</button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
