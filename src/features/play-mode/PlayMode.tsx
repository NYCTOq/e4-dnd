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
  "Poisoned",
  "Prone",
  "Invisible",
  "Stunned",
  "Restrained",
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

  function castSpell(spellId: string) {
    const spell = rulesetData?.spells.find((item) => item.id === spellId);

    if (!spell) return;

    if (spell.level > 0) {
      const slot = spellSlots.find((item) => item.level === spell.level);
      if (!slot || slot.used >= slot.max) return;
    }

    const nextConditions =
      spell.concentration &&
      !activeCharacter.conditions.includes("Concentration")
        ? [...activeCharacter.conditions, "Concentration" as const]
        : activeCharacter.conditions;

    commit({
      spellSlots:
        spell.level === 0
          ? spellSlots
          : spellSlots.map((slot) =>
              slot.level === spell.level
                ? { ...slot, used: slot.used + 1 }
                : slot,
            ),
      conditions: nextConditions,
    });
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

            {equippedItems.weapons.map((weapon) => (
              <button
                className="play-mode-weapon-roll"
                key={weapon.id}
                onClick={() => quickRoll(
                  `${weapon.name} Attack`,
                  getWeaponAttackBonus(activeCharacter, weapon),
                )}
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
                    const slot = spellSlots.find((item) => item.level === spell.level);
                    const disabled = spell.level > 0 && (!slot || slot.used >= slot.max);
                    return (
                      <button key={spell.id} disabled={disabled} onClick={() => castSpell(spell.id)}>
                        <span>{spell.name}{spell.concentration ? " · C" : ""}</span>
                        <small>{spell.level === 0 ? "Cantrip" : disabled ? "Slot yok" : "Cast"}</small>
                      </button>
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
