import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rollDice } from "../../core/dice/diceRoller";
import type { RulesetData, DndSpellData } from "../../core/rulesets/ruleset.types";
import type { AbilityKey, Character } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellAttackBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { LevelUpAssistant } from "./LevelUpAssistant";
import { normalizeClassLevels } from "../../core/rulesets/multiclassRules";
import { calculateEffectiveArmorClass, calculateSuggestedArmorClass, getCharacterInventoryItems, getEquippedItems, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, sortSpellsByLevelAndName } from "./characterShared";
import { getClassFeatureActions } from "../../core/rulesets/classFeatureEngine";
import { getCharacterFeatures, getPassiveScore, getSavingThrowBonus, getSkillBonus, SKILL_ABILITIES } from "../../core/rulesets/characterSheetRules";
import { getCharacterChoiceDebt } from "../../core/rulesets/choiceDebt";
import { ChoiceDebtResolver } from "./ChoiceDebtResolver";
import { getPlayReadiness } from "../../core/character/playReadiness";
import { getCharacterSpellcastingClasses, getSpellcastingStatsForClass, getSpellcastingStatsForSpell } from "../../core/rulesets/multiclassSpellcastingSeparation";
import { getCharacterSheetCertificationSnapshot } from "../../core/rulesets/characterSheetCertification";
import { getPlayerJourneyIntegrationSnapshot } from "../../core/rulesets/playerJourneyIntegration";

interface CharacterCastHistoryItem {
  id: string;
  spellName: string;
  levelLabel: string;
  summary: string;
  details: string[];
  createdAt: string;
}

function parseDiceNotation(notation?: string) {
  const match = notation?.trim().toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);

  if (!match) {
    return null;
  }

  return {
    count: match[1] ? Number(match[1]) : 1,
    sides: Number(match[2]),
    modifier: match[3] ? Number(match[3]) : 0,
  };
}

function getBasicSpellRoll(spell: DndSpellData) {
  const basicRolls: Record<
    string,
    { effectType: string; attackType: string; damageDice?: string; healingDice?: string; damageType?: string; saveAbility?: string }
  > = {
    "cure-wounds": { effectType: "Healing", attackType: "automatic", healingDice: "1d8" },
    "healing-word": { effectType: "Healing", attackType: "automatic", healingDice: "1d4" },
    "guiding-bolt": { effectType: "Damage", attackType: "spell-attack", damageDice: "4d6", damageType: "radiant" },
    "magic-missile": { effectType: "Damage", attackType: "automatic", damageDice: "3d4+3", damageType: "force" },
    fireball: { effectType: "Damage", attackType: "saving-throw", damageDice: "8d6", damageType: "fire", saveAbility: "dex" },
    "spirit-guardians": { effectType: "Damage", attackType: "saving-throw", damageDice: "3d8", damageType: "radiant", saveAbility: "wis" },
    "inflict-wounds": { effectType: "Damage", attackType: "spell-attack", damageDice: "3d10", damageType: "necrotic" },
    "burning-hands": { effectType: "Damage", attackType: "saving-throw", damageDice: "3d6", damageType: "fire", saveAbility: "dex" },
    "scorching-ray": { effectType: "Damage", attackType: "spell-attack", damageDice: "2d6", damageType: "fire" },
    "sacred-flame": { effectType: "Damage", attackType: "saving-throw", damageDice: "1d8", damageType: "radiant", saveAbility: "dex" },
    "fire-bolt": { effectType: "Damage", attackType: "spell-attack", damageDice: "1d10", damageType: "fire" },
    "ray-of-frost": { effectType: "Damage", attackType: "spell-attack", damageDice: "1d8", damageType: "cold" },
    "shocking-grasp": { effectType: "Damage", attackType: "spell-attack", damageDice: "1d8", damageType: "lightning" },
    "produce-flame": { effectType: "Damage", attackType: "spell-attack", damageDice: "1d8", damageType: "fire" },
    "thorn-whip": { effectType: "Damage", attackType: "spell-attack", damageDice: "1d6", damageType: "piercing" },
    "poison-spray": { effectType: "Damage", attackType: "saving-throw", damageDice: "1d12", damageType: "poison", saveAbility: "con" },
  };

  return basicRolls[spell.id] ?? null;
}

function getSpellEffectValue(spell: DndSpellData) {
  const fallback = getBasicSpellRoll(spell);

  return {
    effectType: spell.effectType ?? fallback?.effectType,
    attackType: spell.attackType ?? fallback?.attackType,
    damageDice: spell.damageDice ?? fallback?.damageDice,
    damageType: spell.damageType ?? fallback?.damageType,
    healingDice: spell.healingDice ?? fallback?.healingDice,
    saveAbility: spell.saveAbility ?? fallback?.saveAbility,
    conditionEffect: spell.conditionEffect,
  };
}

function getResolutionLabel(attackType?: string) {
  if (attackType === "spell-attack") {
    return "Spell Attack";
  }

  if (attackType === "saving-throw") {
    return "Saving Throw";
  }

  if (attackType === "automatic") {
    return "Automatic";
  }

  return "Effect";
}

export function CharacterDetail({
  characters,
  rulesetData,
  onUpdateCharacter,
  onDeleteCharacter,
}: {
  characters: Character[];
  rulesetData: RulesetData | null;
  onUpdateCharacter: (character: Character) => void;
  onDeleteCharacter: (id: string) => boolean;
}) {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const character = characters.find((item) => item.id === characterId);

  const [characterRollHistory, setCharacterRollHistory] = useState<
    {
      id: string;
      label: string;
      notation: string;
      rolls: number[];
      total: number;
      createdAt: string;
    }[]
  >([]);

  const [castHistory, setCastHistory] = useState<CharacterCastHistoryItem[]>([]);

  if (!character) {
    return (
      <PageShell
        eyebrow="Character Detail"
        title="Karakter Bulunamadı"
        description="Bu karakter ya silindi ya da boyut kapısından geçti. İkisi de rahatsız edici."
      >
        <button
          className="primary-action"
          onClick={() => navigate("/characters")}
        >
          Karakterlere Dön
        </button>
      </PageShell>
    );
  }

  const activeCharacter: Character = character;
  const choiceDebt=getCharacterChoiceDebt(activeCharacter,rulesetData);
  const readiness=getPlayReadiness(activeCharacter,rulesetData);

  const conditionOptions: Character["conditions"] = [
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

  const knownSpellIds = activeCharacter.knownSpellIds ?? [];
  const preparedSpellIds = activeCharacter.preparedSpellIds ?? [];
  const preparedSpellIdSet = new Set(preparedSpellIds);

  const characterSpells =
    rulesetData?.spells.filter((spell) => knownSpellIds.includes(spell.id)) ?? [];
  const characterSpellGroups = getSpellLevelGroups(characterSpells);
  const castReadyCharacterSpells = sortSpellsByLevelAndName(
    characterSpells.filter((spell) =>
      isSpellReadyToCast(spell, preparedSpellIdSet),
    ),
  );
  const castReadySpellGroups = getSpellLevelGroups(castReadyCharacterSpells);
  const knownCantripCount = characterSpells.filter((spell) => spell.level === 0).length;
  const activeSpellSlots = normalizeSpellSlots(
    activeCharacter.spellSlots,
    activeCharacter.level,
    activeCharacter.className,
  );
  const inventoryDetails = getCharacterInventoryItems(
    activeCharacter.inventory ?? [],
    rulesetData?.items,
  );
  const equippedItems = getEquippedItems(activeCharacter, rulesetData?.items);
  const totalInventoryWeight = getInventoryWeight(
    activeCharacter.inventory ?? [],
    rulesetData?.items,
  );
  const suggestedArmorClass = calculateSuggestedArmorClass(
    activeCharacter,
    rulesetData?.items,
  );
  const effectiveArmorClass = calculateEffectiveArmorClass(
    activeCharacter,
    rulesetData?.items,
  );
  const equippedWeaponAttacks = equippedItems.weapons.map((weapon) => ({
    weapon,
    attackBonus: getWeaponAttackBonus(activeCharacter, weapon),
    damage: getWeaponDamageSummary(activeCharacter, weapon),
  }));
  const selectedClass = rulesetData?.classes.find(
    (classItem) => classItem.name === activeCharacter.className,
  );
  const activeHitDice = normalizeHitDice(
    activeCharacter.hitDice,
    activeCharacter.level,
    activeCharacter.className,
    selectedClass?.hitDie,
  );
  const activeDeathSaves = activeCharacter.deathSaves ?? resetDeathSaves();
  const activeExhaustion = activeCharacter.exhaustion ?? 0;
  const activeConditionDurations = activeCharacter.conditionDurations ?? {};
  const classFeatureActions = getClassFeatureActions(activeCharacter.className, activeCharacter.level, activeCharacter.ruleset);
  const sheetFeatures = getCharacterFeatures(activeCharacter, rulesetData);
  const selectedRace = rulesetData?.races.find((item) => item.name === activeCharacter.race);
  const spellcastingClasses=getCharacterSpellcastingClasses(activeCharacter,rulesetData);
  const spellcastingClassStats=spellcastingClasses.map(entry=>getSpellcastingStatsForClass(activeCharacter,entry.className,rulesetData)).filter((entry): entry is NonNullable<typeof entry>=>Boolean(entry));
  const sheetCertification=getCharacterSheetCertificationSnapshot(activeCharacter,rulesetData);
  const completedSheetSections=Object.values(sheetCertification.sectionCoverage).filter(Boolean).length;
  const journeySnapshot=getPlayerJourneyIntegrationSnapshot(activeCharacter);

  function adjustResource(resourceId: string, amount: number) {
    onUpdateCharacter({
      ...activeCharacter,
      resources: (activeCharacter.resources ?? []).map((resource) => resource.id === resourceId ? { ...resource, used: Math.min(resource.max, Math.max(0, resource.used + amount)) } : resource),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateHp(amount: number) {
    const nextHp = Math.max(
      0,
      Math.min(activeCharacter.maxHp, activeCharacter.currentHp + amount),
    );

    onUpdateCharacter({
      ...activeCharacter,
      currentHp: nextHp,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateTempHp(value: number) {
    onUpdateCharacter({
      ...activeCharacter,
      tempHp: Math.max(0, value),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateDeathSave(type: "successes" | "failures", amount: number) {
    const nextDeathSaves = {
      ...activeDeathSaves,
      [type]: Math.min(3, Math.max(0, activeDeathSaves[type] + amount)),
    };

    onUpdateCharacter({
      ...activeCharacter,
      deathSaves: nextDeathSaves,
      updatedAt: new Date().toISOString(),
    });
  }

  function clearDeathSaves() {
    onUpdateCharacter({
      ...activeCharacter,
      deathSaves: resetDeathSaves(),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateExhaustion(amount: number) {
    onUpdateCharacter({
      ...activeCharacter,
      exhaustion: Math.min(6, Math.max(0, activeExhaustion + amount)),
      updatedAt: new Date().toISOString(),
    });
  }

  function spendHitDie(die: number) {
    const hitDiePool = activeHitDice.find((pool) => pool.die === die);

    if (!hitDiePool || hitDiePool.used >= hitDiePool.max) {
      alert(`d${die} hit die kalmadı. Karakterin dinlenmeye bile bütçesi yetmiyor.`);
      return;
    }

    const result = rollDice({
      count: 1,
      sides: die,
      modifier: getAbilityModifier(activeCharacter.abilities.con),
    });
    const healedAmount = Math.max(0, result.total);
    const nextHp = Math.min(activeCharacter.maxHp, activeCharacter.currentHp + healedAmount);

    onUpdateCharacter({
      ...activeCharacter,
      currentHp: nextHp,
      hitDice: activeHitDice.map((pool) =>
        pool.die === die ? { ...pool, used: pool.used + 1 } : pool,
      ),
      updatedAt: new Date().toISOString(),
    });

    setCharacterRollHistory((current) =>
      [
        {
          id: result.id,
          label: `Short Rest d${die}`,
          notation: result.notation,
          rolls: result.rolls,
          total: healedAmount,
          createdAt: result.createdAt,
        },
        ...current,
      ].slice(0, 8),
    );
  }

  function updateConditionDuration(
    condition: Character["conditions"][number],
    value: number,
  ) {
    const nextDurations = {
      ...activeConditionDurations,
      [condition]: Math.max(0, Math.floor(value)),
    };

    onUpdateCharacter({
      ...activeCharacter,
      conditionDurations: nextDurations,
      updatedAt: new Date().toISOString(),
    });
  }

  function advanceConditionRound() {
    const nextDurations = { ...activeConditionDurations };
    const expiredConditions = new Set<Character["conditions"][number]>();

    for (const condition of activeCharacter.conditions) {
      const duration = nextDurations[condition];

      if (typeof duration !== "number" || duration <= 0) {
        continue;
      }

      const nextDuration = duration - 1;

      if (nextDuration <= 0) {
        delete nextDurations[condition];
        expiredConditions.add(condition);
      } else {
        nextDurations[condition] = nextDuration;
      }
    }

    onUpdateCharacter({
      ...activeCharacter,
      conditions: activeCharacter.conditions.filter(
        (condition) => !expiredConditions.has(condition),
      ),
      conditionDurations: nextDurations,
      updatedAt: new Date().toISOString(),
    });
  }

  function toggleCondition(condition: Character["conditions"][number]) {
    const hasCondition = activeCharacter.conditions.includes(condition);
    const nextDurations = { ...activeConditionDurations };

    if (hasCondition) {
      delete nextDurations[condition];
    }

    onUpdateCharacter({
      ...activeCharacter,
      conditions: hasCondition
        ? activeCharacter.conditions.filter((item) => item !== condition)
        : [...activeCharacter.conditions, condition],
      conditionDurations: nextDurations,
      updatedAt: new Date().toISOString(),
    });
  }

  function togglePreparedSpell(spellId: string) {
    const hasPreparedSpell = preparedSpellIds.includes(spellId);

    onUpdateCharacter({
      ...activeCharacter,
      knownSpellIds: knownSpellIds.includes(spellId)
        ? knownSpellIds
        : [...knownSpellIds, spellId],
      preparedSpellIds: hasPreparedSpell
        ? preparedSpellIds.filter((id) => id !== spellId)
        : [...preparedSpellIds, spellId],
      updatedAt: new Date().toISOString(),
    });
  }



  function castSpell(spell: DndSpellData) {
    const effect = getSpellEffectValue(spell);
    const nextConditions =
      spell.concentration &&
      !activeCharacter.conditions.includes("Concentration")
        ? [...activeCharacter.conditions, "Concentration" as const]
        : activeCharacter.conditions;

    if (spell.level > 0) {
      const slot = activeSpellSlots.find(
        (spellSlot) => spellSlot.level === spell.level,
      );

      if (!slot || slot.used >= slot.max) {
        alert(`${spell.name} için Level ${spell.level} slot kalmadı. Büyü bürokrasisi yine kazandı.`);
        return;
      }
    }

    const details: string[] = [];
    const castSummaryParts: string[] = [];
    const createdAt = new Date().toISOString();

    if (spell.level === 0) {
      castSummaryParts.push("Cantrip, slot harcamadı");
    } else {
      castSummaryParts.push(`Level ${spell.level} slot harcandı`);
    }

    if (spell.concentration) {
      castSummaryParts.push("Concentration aktif");
    }

    if (effect.attackType === "spell-attack") {
      const attackRoll = rollDice({
        count: 1,
        sides: 20,
        modifier: getSpellAttackBonus(activeCharacter),
      });

      details.push(
        `Spell Attack: ${attackRoll.notation} → [${attackRoll.rolls.join(", ")}] = ${attackRoll.total}`,
      );

      setCharacterRollHistory((current) =>
        [
          {
            id: attackRoll.id,
            label: `${spell.name} Attack`,
            notation: attackRoll.notation,
            rolls: attackRoll.rolls,
            total: attackRoll.total,
            createdAt: attackRoll.createdAt,
          },
          ...current,
        ].slice(0, 8),
      );
    }

    if (effect.attackType === "saving-throw") {
      details.push(
        `Save: ${String(effect.saveAbility ?? "?").toUpperCase()} vs DC ${getSpellSaveDc(activeCharacter)}`,
      );
    }

    const damageDice = parseDiceNotation(effect.damageDice);

    if (damageDice) {
      const damageRoll = rollDice(damageDice);
      const damageLabel = effect.damageType ? ` ${effect.damageType}` : "";

      details.push(
        `Damage: ${damageRoll.notation}${damageLabel} → [${damageRoll.rolls.join(", ")}] = ${damageRoll.total}`,
      );
      castSummaryParts.push(`${damageRoll.total}${damageLabel} damage`);

      setCharacterRollHistory((current) =>
        [
          {
            id: damageRoll.id,
            label: `${spell.name} Damage`,
            notation: damageRoll.notation,
            rolls: damageRoll.rolls,
            total: damageRoll.total,
            createdAt: damageRoll.createdAt,
          },
          ...current,
        ].slice(0, 8),
      );
    }

    const healingDice = parseDiceNotation(effect.healingDice);

    if (healingDice) {
      const healingRoll = rollDice(healingDice);

      details.push(
        `Healing: ${healingRoll.notation} → [${healingRoll.rolls.join(", ")}] = ${healingRoll.total}`,
      );
      castSummaryParts.push(`${healingRoll.total} healing`);

      setCharacterRollHistory((current) =>
        [
          {
            id: healingRoll.id,
            label: `${spell.name} Healing`,
            notation: healingRoll.notation,
            rolls: healingRoll.rolls,
            total: healingRoll.total,
            createdAt: healingRoll.createdAt,
          },
          ...current,
        ].slice(0, 8),
      );
    }

    if (!damageDice && effect.damageDice) {
      details.push(`Damage dice okunamadı: ${effect.damageDice}`);
    }

    if (!healingDice && effect.healingDice) {
      details.push(`Healing dice okunamadı: ${effect.healingDice}`);
    }

    if (effect.conditionEffect) {
      details.push(`Condition Effect: ${effect.conditionEffect}`);
    }

    if (!effect.damageDice && !effect.healingDice && effect.attackType !== "spell-attack" && effect.attackType !== "saving-throw") {
      details.push(`${getResolutionLabel(effect.attackType)} spell cast edildi. Roll gerektiren effect tanımlı değil.`);
    }

    onUpdateCharacter({
      ...activeCharacter,
      spellSlots:
        spell.level === 0
          ? activeSpellSlots
          : activeSpellSlots.map((spellSlot) =>
              spellSlot.level === spell.level
                ? { ...spellSlot, used: spellSlot.used + 1 }
                : spellSlot,
            ),
      conditions: nextConditions,
      updatedAt: createdAt,
    });

    setCastHistory((current) =>
      [
        {
          id: crypto.randomUUID(),
          spellName: spell.name,
          levelLabel: getSpellLevelLabel(spell),
          summary: castSummaryParts.join(" · "),
          details,
          createdAt,
        },
        ...current,
      ].slice(0, 10),
    );
  }

  function canCastSpell(spell: DndSpellData) {
    if (spell.level === 0) {
      return true;
    }

    const slot = activeSpellSlots.find(
      (spellSlot) => spellSlot.level === spell.level,
    );

    return !!slot && slot.used < slot.max;
  }

  function longRest() {
    onUpdateCharacter({
      ...activeCharacter,
      currentHp: activeCharacter.maxHp,
      tempHp: 0,
      spellSlots: resetSpellSlots(activeSpellSlots),
      hitDice: resetHitDice(activeHitDice),
      deathSaves: resetDeathSaves(),
      exhaustion: Math.max(0, activeExhaustion - 1),
      conditionDurations: {},
      conditions: activeCharacter.conditions.filter(
        (item) => item === "Cursed",
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function deleteCurrentCharacter() {
    const deleted = onDeleteCharacter(activeCharacter.id);

    if (deleted) {
      navigate("/characters");
    }
  }

  function quickCharacterRoll(label: string, modifier: number) {
    const result = rollDice({
      count: 1,
      sides: 20,
      modifier,
    });

    setCharacterRollHistory((current) =>
      [
        {
          id: result.id,
          label,
          notation: result.notation,
          rolls: result.rolls,
          total: result.total,
          createdAt: result.createdAt,
        },
        ...current,
      ].slice(0, 8),
    );
  }

  return (
    <PageShell
      eyebrow="Character Detail"
      title={activeCharacter.name}
      description={`${activeCharacter.race || "Unknown Race"} • ${
        activeCharacter.className || "Unknown Class"
      } • Level ${activeCharacter.level}`}
    >
      <div className="detail-layout">
        <section className="detail-main-card">
          <div className="character-card-top">
            <div>
              <span className="mini-label">{activeCharacter.ruleset}</span>
              <h2>{activeCharacter.name}</h2>

              <p>
                {activeCharacter.background || "Background yok"}{" "}
                {activeCharacter.subclass
                  ? `• ${activeCharacter.subclass}`
                  : ""}
              </p>
              <p>{normalizeClassLevels(activeCharacter.classLevels,activeCharacter.className,activeCharacter.level).map(item=>`${item.className} ${item.level}${item.subclass?` (${item.subclass})`:""}`).join(" · ")}</p>
            </div>

            <strong className="level-badge">Lv. {activeCharacter.level}</strong>
          </div>

          <div className="character-actions detail-actions">
            <button
              onClick={() => navigate(`/characters/${activeCharacter.id}/edit`)}
            >
              Düzenle
            </button>

            <button onClick={deleteCurrentCharacter}>Sil</button>

            <button onClick={() => navigate(`/play-mode?character=${activeCharacter.id}`)}>Play Mode</button>

            <button onClick={() => navigate("/characters")}>Listeye Dön</button>
          </div>

          <section className={`play-readiness-card ${readiness.status}`}>
            <div><span className="mini-label">Character Integrity</span><strong>{readiness.status==="ready"?"Karakter masaya hazır":`Oynanabilirlik skoru: ${readiness.score}%`}</strong><p>{readiness.status==="ready"?"Kimlik, progression, seçim, spell, equipment ve combat kayıtları doğrulandı.":`${readiness.issues.filter(issue=>issue.severity==="error").length} zorunlu düzeltme bulundu.`}</p></div>
            <div className="play-readiness-actions"><button type="button" onClick={()=>navigate(`/characters/${activeCharacter.id}/edit`)}>Eksikleri düzelt</button></div>
          </section>
          {readiness.issues.length?<details className="character-sheet-section"><summary><span><b>Doğrulama Raporu</b><small>Bölüm bazlı veri ve kural kontrolleri</small></span><em>{readiness.issues.length} kayıt</em></summary><div className="character-sheet-section-body"><ul className="validation-issue-list">{readiness.issues.map(issue=><li key={issue.id}><button type="button" onClick={()=>navigate(`/characters/${activeCharacter.id}/edit`)}><strong>{issue.severity==="error"?"Hata":"Uyarı"} · {issue.section}</strong>{issue.message}<span>Düzelt →</span></button></li>)}</ul></div></details>:null}

          {choiceDebt.length?<details className="character-sheet-section" open><summary><span><b>Choice Debt Resolver</b><small>{choiceDebt.length} zorunlu seçim eksik</small></span><em>Tamamlanmalı</em></summary><div className="character-sheet-section-body"><ChoiceDebtResolver character={activeCharacter} rulesetData={rulesetData} onUpdateCharacter={onUpdateCharacter}/></div></details>:null}

          <details className="character-sheet-section character-sheet-level-up">
            <summary>
              <span>
                <b>Level Up Assistant</b>
                <small>Seviye artırma, HP ve ASI işlemleri</small>
              </span>
              <em>İsteğe bağlı</em>
            </summary>
            <div className="character-sheet-section-body">
              <LevelUpAssistant
                character={activeCharacter}
                rulesetData={rulesetData}
                onUpdateCharacter={onUpdateCharacter}
              />
            </div>
          </details>

          <section className="player-journey-integration panel" aria-label="Sheet Play Mode Rest entegrasyonu"><div><span className="mini-label">Player Journey Integration</span><h2>Sheet → Play → Rest</h2><p>{journeySnapshot.restReason}</p></div><div className="player-journey-integration-grid"><span>HP eksik <strong>{journeySnapshot.hpMissing}</strong></span><span>Slot harcandı <strong>{journeySnapshot.spentSpellSlots+journeySnapshot.spentPactSlots}</strong></span><span>Kaynak harcandı <strong>{journeySnapshot.spentResources}</strong></span><span>Öneri <strong>{journeySnapshot.restRecommendation==="long"?"Long Rest":journeySnapshot.restRecommendation==="short"?"Short Rest":"Hazır"}</strong></span></div><div className="player-journey-actions"><button type="button" onClick={()=>navigate(`/play-mode?character=${activeCharacter.id}`)}>Play Mode</button><button type="button" onClick={()=>navigate("/rest")}>Rest Center</button></div></section>
          <section className="character-sheet-command-center" aria-label="Karakter kağıdı hızlı özeti"><div className="character-sheet-command-heading"><div><span className="mini-label">Table Ready Snapshot</span><h2>Masada Hızlı Özet</h2><p>{sheetCertification.classSummary}</p></div><strong>{completedSheetSections}/7 bölüm</strong></div><div className="character-sheet-command-grid"><article><span>HP</span><strong>{activeCharacter.currentHp}/{activeCharacter.maxHp}</strong><small>{activeCharacter.tempHp?`+${activeCharacter.tempHp} geçici`:"Geçici HP yok"}</small></article><article><span>Savunma</span><strong>AC {effectiveArmorClass}</strong><small>Initiative {formatModifier(getInitiative(activeCharacter))}</small></article><article><span>Kaynaklar</span><strong>{sheetCertification.usableResourceCount} hazır</strong><small>{sheetCertification.exhaustedResourceCount} tükenmiş</small></article><article><span>Büyüler</span><strong>{sheetCertification.preparedSpellCount}/{sheetCertification.knownSpellCount}</strong><small>{sheetCertification.spellcastingClassCount} casting class</small></article><article><span>Ekipman</span><strong>{sheetCertification.equippedItemCount} kuşanılmış</strong><small>{sheetCertification.attunedItemCount}/3 attuned</small></article><article><span>Aktif Durum</span><strong>{sheetCertification.activeConditionCount+sheetCertification.activeEffectCount}</strong><small>{sheetCertification.activeConditionCount} condition · {sheetCertification.activeEffectCount} effect</small></article></div></section>

          <div className="ability-detail-grid">
            {Object.entries(activeCharacter.abilities).map(
              ([ability, score]) => (
                <div className="ability-detail-card" key={ability}>
                  <span>{ability.toUpperCase()}</span>
                  <strong>{score}</strong>
                  <em>{formatModifier(getAbilityModifier(score))}</em>
                </div>
              ),
            )}
          </div>

          <div className="detail-stat-grid">
            <div>
              <span>Armor Class</span>
              <strong>{effectiveArmorClass}</strong>
              <em>{activeCharacter.armorClassMode === "auto" ? "Auto" : "Manual"}</em>
            </div>

            <div>
              <span>Proficiency</span>
              <strong>+{getProficiencyBonus(activeCharacter.level)}</strong>
            </div>

            <div>
              <span>Initiative</span>
              <strong>{formatModifier(getInitiative(activeCharacter))}</strong>
            </div>

            <div>
              <span>Passive Perception</span>
              <strong>{getPassivePerception(activeCharacter)}</strong>
            </div>

            {spellcastingClassStats.length ? spellcastingClassStats.map((entry)=><div key={`spellcasting-${entry.className}`}><span>{entry.className} Spellcasting</span><strong>DC {entry.saveDc}</strong><em>{entry.ability.toUpperCase()} · Atk {formatModifier(entry.attackBonus)}</em></div>) : <>
            <div><span>Spell Save DC</span><strong>{getSpellSaveDc(activeCharacter)}</strong></div>
            <div><span>Spell Attack</span><strong>{formatModifier(getSpellAttackBonus(activeCharacter))}</strong></div>
            </>}
          </div>

          <details className="character-sheet-section" open>
            <summary><span><b>Saving Throws & Skills</b><small>Proficiency, expertise ve hızlı D20 roll</small></span><em>{activeCharacter.skillProficiencies?.length ?? 0} proficient</em></summary>
            <div className="character-sheet-section-body">
              <div className="builder-summary-grid">
                {(["str","dex","con","int","wis","cha"] as AbilityKey[]).map((ability)=>{
                  const bonus=getSavingThrowBonus(activeCharacter,ability,rulesetData);
                  return <button type="button" key={ability} onClick={()=>quickCharacterRoll(`${ability.toUpperCase()} Saving Throw`,bonus)}><span>{ability.toUpperCase()} Save</span><strong>{formatModifier(bonus)}</strong></button>;
                })}
              </div>
              <div className="builder-choice-grid">
                {Object.entries(SKILL_ABILITIES).map(([skill,ability])=>{
                  const bonus=getSkillBonus(activeCharacter,skill); const proficient=activeCharacter.skillProficiencies?.includes(skill); const expertise=activeCharacter.expertiseSkills?.includes(skill);
                  return <article className={`builder-choice-card ${proficient ? "selected" : ""}`} key={skill}><div className="panel-heading-row"><div><span className="mini-label">{ability.toUpperCase()} · {expertise?"Expertise":proficient?"Proficient":"Untrained"}</span><h3>{skill}</h3></div><button type="button" onClick={()=>quickCharacterRoll(`${skill} Check`,bonus)}>{formatModifier(bonus)}</button></div></article>;
                })}
              </div>
              <div className="preview-stats"><span>Passive Perception {getPassiveScore(activeCharacter,"Perception")}</span><span>Passive Investigation {getPassiveScore(activeCharacter,"Investigation")}</span><span>Passive Insight {getPassiveScore(activeCharacter,"Insight")}</span></div>
            </div>
          </details>

          <details className="character-sheet-section" open>
            <summary><span><b>Features & Proficiencies</b><small>Class, subclass, feat ve origin bilgileri</small></span><em>{sheetFeatures.length} feature</em></summary>
            <div className="character-sheet-section-body">
              <div className="preview-stats">
                <span>Speed {selectedRace?.speed ?? 30} ft</span>
                <span>Armor {selectedClass?.armorProficiencies.join(", ") || "None"}</span>
                <span>Weapons {selectedClass?.weaponProficiencies.join(", ") || "None"}</span>
                <span>Tools {activeCharacter.toolProficiencies?.join(", ") || "None"}</span>
                <span>Languages {activeCharacter.languages?.join(", ") || selectedRace?.languages?.join(", ") || "None"}</span>
              </div>
              <div className="cast-history-list">{sheetFeatures.map((feature,index)=><div className="cast-history-item" key={`${feature.source}-${feature.name}-${index}`}><div><strong>{feature.name}</strong><span>{feature.source}</span></div><p>{feature.summary}</p></div>)}</div>
            </div>
          </details>

          <div className="notes-box">
            <span className="mini-label">Notes</span>
            <p>
              {activeCharacter.notes ||
                "Not yok. Karakterin gizemli olması güzel ama app’in boş kalması değil."}
            </p>
          </div>

          <details className="character-sheet-section" open>
            <summary>
              <span>
                <b>Envanter & Ekipman</b>
                <small>{inventoryDetails.length} item · {totalInventoryWeight.toFixed(1)} lb</small>
              </span>
              <em>{activeCharacter.gold ?? 0} gp</em>
            </summary>
            <div className="character-sheet-section-body">
              <div className="character-equipment-panel">
            <div className="spell-selector-head">
              <div>
                <span className="mini-label">Equipment</span>
                <h2>Envanter & Kuşanılanlar</h2>
              </div>

              <div className="spell-selector-counts">
                <span>{activeCharacter.gold ?? 0} gp</span>
                <span>{inventoryDetails.length} item</span>
                <span>{totalInventoryWeight.toFixed(1)} lb</span>
              </div>
            </div>

            <div className="inventory-equipped-grid detail-equipped-grid">
              <div>
                <span>Armor</span>
                <strong>{equippedItems.armor?.name ?? "None"}</strong>
              </div>
              <div>
                <span>Shield</span>
                <strong>{equippedItems.shield?.name ?? "None"}</strong>
              </div>
              <div>
                <span>Weapons</span>
                <strong>
                  {equippedItems.weapons.map((item) => item.name).join(", ") || "None"}
                </strong>
              </div>
              <div>
                <span>Effective AC</span>
                <strong>{effectiveArmorClass}</strong>
              </div>
              <div>
                <span>Suggested AC</span>
                <strong>{suggestedArmorClass}</strong>
              </div>
              <div>
                <span>AC Mode</span>
                <strong>{activeCharacter.armorClassMode === "auto" ? "Auto" : "Manual"}</strong>
              </div>
            </div>

            {equippedWeaponAttacks.length > 0 ? (
              <div className="weapon-attack-list">
                {equippedWeaponAttacks.map(({ weapon, attackBonus, damage }) => (
                  <article className="weapon-attack-card" key={weapon.id}>
                    <div>
                      <strong>{weapon.name}</strong>
                      <span>{weapon.damage} • {weapon.damageType} • {weapon.properties?.join(", ") || "Standard"}</span>
                    </div>
                    <div>
                      <b>{formatModifier(attackBonus)}</b>
                      <small>{damage}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {inventoryDetails.length === 0 ? (
              <div className="spell-selector-note">
                Envanter boş. Kahraman cebinde umutla geziyor, o da 0 gp.
              </div>
            ) : (
              <div className="inventory-detail-list">
                {inventoryDetails.map(({ entry, item }) => (
                  <article className="inventory-detail-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{getItemCategoryLabel(item.category)} • {getItemRulesSummary(item)}</span>
                    </div>
                    <div>
                      <b>x{entry.quantity}</b>
                      <small>{(entry.quantity * item.weight).toFixed(1)} lb</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
              </div>
            </div>
          </details>

          <details className="character-sheet-section">
            <summary>
              <span>
                <b>Karakter Büyü Kitabı</b>
                <small>{knownSpellIds.length} bilinen · {preparedSpellIds.length} hazırlanmış</small>
              </span>
              <em>{knownCantripCount} cantrip</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="character-detail-spellbook">
            <div className="spell-selector-head">
              <div>
                <span className="mini-label">Character Spellbook</span>
                <h2>Seçili Büyüler</h2>
              </div>

              <div className="spell-selector-counts">
                <span>{knownSpellIds.length} known</span>
                <span>{knownCantripCount} cantrip</span>
                <span>{preparedSpellIds.length} prepared</span>
              </div>
            </div>

            {characterSpells.length === 0 ? (
              <div className="spell-selector-note">
                Bu karaktere henüz spell eklenmedi. Cleric olup dua kitabını
                evde unutmak gibi, hoş değil ama düzeltilebilir.
              </div>
            ) : (
              <div className="character-detail-spell-groups">
                {characterSpellGroups.map((group) => (
                  <div className="spell-level-group" key={group.level}>
                    <h3 className="spell-level-title">
                      {getSpellGroupTitle(group.level)}
                    </h3>

                    <div className="character-detail-spell-grid">
                      {group.spells.map((spell) => {
                        const isPrepared = preparedSpellIdSet.has(spell.id);
                        const isCantrip = spell.level === 0;
                        const isReady = isSpellReadyToCast(
                          spell,
                          preparedSpellIdSet,
                        );

                        return (
                          <article className="detail-spell-card" key={spell.id}>
                            <div className="library-item-top">
                              <div>
                                <span className="mini-label">{spell.school}</span>
                                <h3>{spell.name}{(()=>{const stats=getSpellcastingStatsForSpell(activeCharacter,spell,rulesetData);return stats?` · ${stats.className} (${stats.spellcastingAbility.toUpperCase()})`:""})()}</h3>
                              </div>

                              <span>{getSpellLevelLabel(spell)}</span>
                            </div>

                            <div className="spell-meta-grid">
                              <span>Cast: {spell.castingTime}</span>
                              <span>Range: {spell.range}</span>
                              <span>Duration: {spell.duration}</span>
                              <span>Comp: {spell.components.join(", ")}</span>
                              {spell.concentration ? <span>Concentration</span> : null}
                              {spell.ritual ? <span>Ritual</span> : null}
                            </div>

                            <details className="spell-description-toggle">
                              <summary>Details</summary>
                              <p>{spell.description}</p>

                              {spell.higherLevels ? (
                                <p className="spell-higher-levels">
                                  {spell.higherLevels}
                                </p>
                              ) : null}
                            </details>

                            <div className="spell-row-actions detail-spell-actions">
                              {isCantrip ? (
                                <span className="spell-status-pill active">
                                  Always Ready
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={isPrepared ? "active" : ""}
                                  onClick={() => togglePreparedSpell(spell.id)}
                                >
                                  {isPrepared ? "Prepared" : "Prepare"}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={!isReady || !canCastSpell(spell)}
                                onClick={() => castSpell(spell)}
                              >
                                {isCantrip ? "Cast" : `Cast L${spell.level}`}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          </details>
        </section>

        <aside className="play-card">
          <span className="mini-label">Play Mode</span>

          <div className="hp-display">
            <strong>
              {activeCharacter.currentHp}/{activeCharacter.maxHp}
            </strong>
            <span>Current HP</span>
          </div>

          <div className="hp-button-grid">
            <button onClick={() => updateHp(-10)}>-10</button>
            <button onClick={() => updateHp(-5)}>-5</button>
            <button onClick={() => updateHp(-1)}>-1</button>
            <button onClick={() => updateHp(1)}>+1</button>
            <button onClick={() => updateHp(5)}>+5</button>
            <button onClick={() => updateHp(10)}>+10</button>
          </div>

          <label className="temp-hp-field">
            Temp HP
            <input
              type="number"
              min={0}
              value={activeCharacter.tempHp}
              onChange={(event) => updateTempHp(Number(event.target.value))}
            />
          </label>

          <details className="character-sheet-section character-sheet-side-section">
            <summary>
              <span>
                <b>Gelişmiş Durum</b>
                <small>Death save, exhaustion ve short rest</small>
              </span>
              <em>{activeExhaustion}/6</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="advanced-character-panel">
            <div className="spell-slot-head">
              <span className="mini-label">Advanced Tools</span>
              <button type="button" onClick={clearDeathSaves}>Clear Saves</button>
            </div>

            <div className="death-save-grid">
              <div>
                <span>Death Successes</span>
                <strong>{activeDeathSaves.successes}/3</strong>
                <div className="tiny-button-row">
                  <button type="button" onClick={() => updateDeathSave("successes", -1)}>-</button>
                  <button type="button" onClick={() => updateDeathSave("successes", 1)}>+</button>
                </div>
              </div>

              <div>
                <span>Death Failures</span>
                <strong>{activeDeathSaves.failures}/3</strong>
                <div className="tiny-button-row">
                  <button type="button" onClick={() => updateDeathSave("failures", -1)}>-</button>
                  <button type="button" onClick={() => updateDeathSave("failures", 1)}>+</button>
                </div>
              </div>

              <div>
                <span>Exhaustion</span>
                <strong>{activeExhaustion}/6</strong>
                <div className="tiny-button-row">
                  <button type="button" onClick={() => updateExhaustion(-1)}>-</button>
                  <button type="button" onClick={() => updateExhaustion(1)}>+</button>
                </div>
              </div>
            </div>

            <div className="hit-dice-panel">
              <span className="mini-label">Short Rest</span>
              {activeHitDice.map((pool) => {
                const remaining = pool.max - pool.used;

                return (
                  <button
                    key={pool.die}
                    type="button"
                    disabled={remaining <= 0 || activeCharacter.currentHp >= activeCharacter.maxHp}
                    onClick={() => spendHitDie(pool.die)}
                  >
                    Spend d{pool.die} Hit Die · {remaining}/{pool.max} left
                  </button>
                );
              })}
            </div>
          </div>
            </div>
          </details>

          <details className="character-sheet-section character-sheet-side-section" open>
            <summary>
              <span><b>Class Features</b><small>Action ve kullanım kaynakları</small></span>
              <em>{(activeCharacter.resources ?? []).reduce((sum, item) => sum + item.max - item.used, 0)} kalan</em>
            </summary>
            <div className="character-sheet-section-body">
              {(activeCharacter.resources ?? []).length === 0 ? <div className="spell-slot-empty">Bu class için takip edilen kaynak henüz yok.</div> : (
                <div className="spell-slot-grid">
                  {(activeCharacter.resources ?? []).map((resource) => <div className="spell-slot-card" key={resource.id}>
                    <span>{resource.name}</span><strong>{resource.max - resource.used}/{resource.max}</strong><small>{resource.recovery} rest</small>
                    <div className="tiny-button-row"><button type="button" disabled={resource.used <= 0} onClick={() => adjustResource(resource.id, -1)}>Geri Al</button><button type="button" disabled={resource.used >= resource.max} onClick={() => adjustResource(resource.id, 1)}>Kullan</button></div>
                  </div>)}
                </div>
              )}
              <div className="cast-history-list">
                {classFeatureActions.map((action) => <div className="cast-history-item" key={action.id}><div><strong>{action.name}</strong><span>{action.actionType}</span></div><p>{action.summary}</p></div>)}
              </div>
            </div>
          </details>

          <details className="character-sheet-section character-sheet-side-section" open>
            <summary>
              <span>
                <b>Spell Slots</b>
                <small>Büyü kaynaklarını takip et</small>
              </span>
              <em>{activeSpellSlots.reduce((sum, slot) => sum + slot.max - slot.used, 0)} kalan</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="spell-slot-panel">
            <div className="spell-slot-head">
              <span className="mini-label">Spell Slots</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateCharacter({
                    ...activeCharacter,
                    spellSlots: resetSpellSlots(activeSpellSlots),
                    updatedAt: new Date().toISOString(),
                  })
                }
              >
                Restore Slots
              </button>
            </div>

            {activeSpellSlots.length === 0 ? (
              <div className="spell-slot-empty">
                Bu karakter için slot yok. Ya caster değil ya da sistem henüz
                onu ciddiye almıyor.
              </div>
            ) : (
              <div className="spell-slot-grid">
                {activeSpellSlots.map((slot) => {
                  const remaining = slot.max - slot.used;

                  return (
                    <div className="spell-slot-card" key={slot.level}>
                      <span>Level {slot.level}</span>
                      <strong>
                        {remaining}/{slot.max}
                      </strong>
                      <div className="spell-slot-bar">
                        <span
                          style={{
                            width: `${Math.round((remaining / slot.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <small>{slot.used} used</small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </div>
          </details>

          <details className="character-sheet-section character-sheet-side-section">
            <summary>
              <span>
                <b>Hazır Büyüler</b>
                <small>Hızlı cast ve geçmiş</small>
              </span>
              <em>{castReadyCharacterSpells.length}</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="prepared-cast-panel">
            <span className="mini-label">Prepared Cast</span>

            {castReadyCharacterSpells.length === 0 ? (
              <div className="spell-slot-empty">
                Cast edilecek büyü yok. Büyücü var, evrak yok. Bürokrasi kazanıyor.
              </div>
            ) : (
              <div className="prepared-cast-list">
                {castReadySpellGroups.map((group) => (
                  <div className="prepared-cast-group" key={group.level}>
                    <strong>{getSpellGroupTitle(group.level)}</strong>

                    {group.spells.map((spell) => (
                      <button
                        key={spell.id}
                        type="button"
                        disabled={!canCastSpell(spell)}
                        onClick={() => castSpell(spell)}
                      >
                        <span>{spell.name}</span>
                        <small>{getSpellLevelLabel(spell)}</small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cast-history-panel">
            <span className="mini-label">Cast History</span>

            {castHistory.length === 0 ? (
              <div className="spell-slot-empty">
                Henüz cast sonucu yok. Büyüler sessiz, bu da nadiren iyi haber.
              </div>
            ) : (
              <div className="cast-history-list">
                {castHistory.map((cast) => (
                  <div className="cast-history-item" key={cast.id}>
                    <div>
                      <strong>{cast.spellName}</strong>
                      <span>{cast.levelLabel}</span>
                    </div>

                    <p>{cast.summary}</p>

                    {cast.details.length > 0 ? (
                      <ul>
                        {cast.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          </details>

          <details className="character-sheet-section character-sheet-side-section">
            <summary>
              <span>
                <b>Conditions</b>
                <small>Durumlar ve round süreleri</small>
              </span>
              <em>{activeCharacter.conditions.length} aktif</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="condition-picker">
            {conditionOptions.map((condition) => (
              <button
                key={condition}
                className={
                  activeCharacter.conditions.includes(condition) ? "active" : ""
                }
                onClick={() => toggleCondition(condition)}
              >
                {condition}
              </button>
            ))}
          </div>

          <div className="condition-duration-panel">
            <div className="spell-slot-head">
              <span className="mini-label">Condition Rounds</span>
              <button type="button" onClick={advanceConditionRound}>Round End</button>
            </div>

            {activeCharacter.conditions.length === 0 ? (
              <div className="spell-slot-empty">Aktif condition yok. Nadir bir masa huzuru.</div>
            ) : (
              <div className="condition-duration-list">
                {activeCharacter.conditions.map((condition) => (
                  <label key={condition}>
                    <span>{condition}</span>
                    <input
                      type="number"
                      min={0}
                      value={activeConditionDurations[condition] ?? 0}
                      onChange={(event) =>
                        updateConditionDuration(condition, Number(event.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
            </div>
          </details>

          <details className="character-sheet-section character-sheet-side-section" open>
            <summary>
              <span>
                <b>Quick Rolls</b>
                <small>Check, initiative ve zar geçmişi</small>
              </span>
              <em>{characterRollHistory[0]?.total ?? "--"}</em>
            </summary>
            <div className="character-sheet-section-body">
          <div className="character-roll-result">
            <span className="mini-label">Latest Roll</span>

            {characterRollHistory[0] ? (
              <>
                <strong className="character-roll-total">
                  {characterRollHistory[0].total}
                </strong>

                <p>
                  {activeCharacter.name} - {characterRollHistory[0].label}
                  <br />
                  {characterRollHistory[0].notation} → [
                  {characterRollHistory[0].rolls.join(", ")}]
                </p>
              </>
            ) : (
              <>
                <strong className="character-roll-total">--</strong>
                <p>Henüz karakter üzerinden zar atılmadı. Kader beklemede.</p>
              </>
            )}
          </div>

          <div className="quick-roll-panel">
            <span className="mini-label">Quick Rolls</span>
            <div className="character-roll-history">
              <span className="mini-label">Roll History</span>

              {characterRollHistory.length === 0 ? (
                <div className="character-roll-empty">
                  Geçmiş boş. Henüz kimse kaderle pazarlık yapmamış.
                </div>
              ) : (
                characterRollHistory.map((roll) => (
                  <div className="character-roll-item" key={roll.id}>
                    <div>
                      <strong>{roll.label}</strong>
                      <span>
                        {roll.notation} → [{roll.rolls.join(", ")}]
                      </span>
                    </div>

                    <b>{roll.total}</b>
                  </div>
                ))
              )}
            </div>

            <div className="quick-roll-grid">
              <button
                onClick={() =>
                  quickCharacterRoll(
                    "Initiative",
                    getInitiative(activeCharacter),
                  )
                }
              >
                Initiative
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "STR Check",
                    getAbilityModifier(activeCharacter.abilities.str),
                  )
                }
              >
                STR
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "DEX Check",
                    getAbilityModifier(activeCharacter.abilities.dex),
                  )
                }
              >
                DEX
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "CON Check",
                    getAbilityModifier(activeCharacter.abilities.con),
                  )
                }
              >
                CON
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "INT Check",
                    getAbilityModifier(activeCharacter.abilities.int),
                  )
                }
              >
                INT
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "WIS Check",
                    getAbilityModifier(activeCharacter.abilities.wis),
                  )
                }
              >
                WIS
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "CHA Check",
                    getAbilityModifier(activeCharacter.abilities.cha),
                  )
                }
              >
                CHA
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "Spell Attack",
                    getSpellAttackBonus(activeCharacter),
                  )
                }
              >
                Spell
              </button>

              <button onClick={() => quickCharacterRoll("Death Save", 0)}>
                Death
              </button>
            </div>
          </div>
            </div>
          </details>

          <div className="character-actions character-sheet-rest-actions">
            <button onClick={longRest}>Long Rest</button>
            <button onClick={() => navigate(`/play-mode`)}>Play Mode'a Geç</button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
