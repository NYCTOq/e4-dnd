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
  const handledResourceIds=new Set(["sorcery-points","wild-shape","superiority-dice"]);
  const classActions=getClassFeatureActions(activeCharacter.className,activeCharacter.level,activeCharacter.ruleset).filter(action=>action.resourceId&&!handledResourceIds.has(action.resourceId)&&activeCharacter.resources.some(resource=>resource.id===action.resourceId));
  const arcanumSpells=(rulesetData?.spells??[]).filter(spell=>activeCharacter.arcanumSpellIds?.includes(spell.id));
  const paladinAuras=isPaladin(activeCharacter.className)?getPaladinAuraSummary(activeCharacter.level):null;
  const activeSpellEffects=activeCharacter.activeSpellEffects??[];
  const conditionEffects=getConditionEffects(activeCharacter.conditions);

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

  function takeDamage(critical=false){const result=applyDamage({currentHp:activeCharacter.currentHp,maxHp:activeCharacter.maxHp,tempHp:activeCharacter.tempHp,deathSaves:activeCharacter.deathSaves},survivalAmount,critical);commit({currentHp:result.currentHp,tempHp:result.tempHp,deathSaves:result.deathSaves});if(activeSpellEffects.some(effect=>effect.concentration))setPendingConcentrationDc(result.concentrationDc);setRollHistory(current=>[{id:crypto.randomUUID(),label:`${critical?"Kritik ":""}Hasar${result.absorbedByTempHp?` · ${result.absorbedByTempHp} Temp HP emdi`:""}`,notation:`-${survivalAmount} HP`,total:-survivalAmount},...current].slice(0,6))}
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
    const resolutionRolls:RollResult[]=[];if(spell.attackType==="spell-attack"){const attack=rollDice({count:1,sides:20,modifier:getSpellAttackBonus(activeCharacter)});resolutionRolls.push({id:attack.id,label:`${spell.name} Attack`,notation:attack.notation,total:attack.total})}if(total!==null)resolutionRolls.push({id:crypto.randomUUID(),label:`${spell.name}${spell.healingDice?" Healing":" Damage"}`,notation:formula!,total});if(resolutionRolls.length)setRollHistory(current=>[...resolutionRolls,...current].slice(0,6));
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

  function weaponAttack(weapon:(typeof equippedItems.weapons)[number]){if(conditionEffects.blocksActions)return;const effectiveMode=combineRollModes(attackMode,conditionEffects.attackMode);const modifier=getWeaponAttackBonus(activeCharacter,weapon);const dice=rollDice({count:effectiveMode==="normal"?1:2,sides:20,modifier:0});const attack=resolveAttack(dice.rolls,modifier,targetAc,effectiveMode);const results:RollResult[]=[{id:dice.id,label:`${weapon.name} · ${attack.hit?attack.critical?"CRITICAL":"Hit":"Miss"}`,notation:`${effectiveMode} · [${dice.rolls.join(", ")}] ${formatModifier(modifier)} vs AC ${targetAc}`,total:attack.total}];if(attack.hit){const formula=getCriticalDamageFormula(getWeaponDamageSummary(activeCharacter,weapon),attack.critical);if(formula){const damage=rollDice(formula);results.push({id:damage.id,label:`${weapon.name} Damage${attack.critical?" · Critical":""}`,notation:damage.notation,total:damage.total})}}setRollHistory(current=>[...results,...current].slice(0,6))}

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
            <div><span>Init</span><strong>{formatModifier(getInitiative(activeCharacter))}</strong></div>
            <div><span>Prof</span><strong>+{getProficiencyBonus(activeCharacter.level)}</strong></div>
            <div><span>Save DC</span><strong>{getSpellSaveDc(activeCharacter)}</strong></div>
            <div><span>Spell Atk</span><strong>{formatModifier(getSpellAttackBonus(activeCharacter))}</strong></div>
          </div>
        </section>

        <div className="play-mode-grid">
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
                disabled={conditionEffects.blocksActions}
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

          <section className="play-mode-card play-mode-spell-card">
            <div className="play-mode-section-head">
              <div><span className="mini-label">Prepared Spells</span><h2>Hızlı Büyüler</h2></div>
              <span>{spells.length} hazır</span>
            </div>

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
