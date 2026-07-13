import { useMemo, useState } from "react";
import type { Character, AbilityKey } from "../../core/character/character.types";
import { getProficiencyBonus } from "../../core/character/characterCalculator";
import { rollDice } from "../../core/dice/diceRoller";
import type { DndItemData, DndMonsterData } from "../../core/rulesets/ruleset.types";
import type { CampaignEncounterParticipant } from "./campaignTypes";
import { getMonsterAbilityModifier } from "../monsters/monsterUtils";

type CombatRollEntry = {
  id: string;
  label: string;
  notation: string;
  total: number;
  detail: string;
  createdAt: string;
};

type ParsedMonsterAction = {
  name: string;
  attackBonus: number | null;
  damageCount: number | null;
  damageSides: number | null;
  damageModifier: number;
  raw: string;
};

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function parseMonsterAction(action: string): ParsedMonsterAction {
  const [namePart] = action.split(":");
  const attackMatch = action.match(/([+-]\d+)\s*to hit/i);
  const damageMatch = action.match(/(\d+)d(\d+)\s*([+-]\s*\d+)?/i);

  return {
    name: namePart?.trim() || "Action",
    attackBonus: attackMatch ? Number(attackMatch[1]) : null,
    damageCount: damageMatch ? Number(damageMatch[1]) : null,
    damageSides: damageMatch ? Number(damageMatch[2]) : null,
    damageModifier: damageMatch?.[3]
      ? Number(damageMatch[3].replace(/\s/g, ""))
      : 0,
    raw: action,
  };
}

function getWeaponAbility(character: Character, weapon: DndItemData): AbilityKey {
  const properties = (weapon.properties ?? []).map((property) => property.toLowerCase());
  const tags = (weapon.tags ?? []).map((tag) => tag.toLowerCase());
  const isRanged = Boolean(weapon.range) || properties.includes("ammunition") || tags.includes("ranged");
  const isFinesse = properties.includes("finesse") || tags.includes("finesse");

  if (isRanged) {
    return "dex";
  }

  if (isFinesse) {
    return getMonsterAbilityModifier(character.abilities.dex) >
      getMonsterAbilityModifier(character.abilities.str)
      ? "dex"
      : "str";
  }

  return "str";
}

function parseDamageDice(damage?: string) {
  const match = damage?.match(/(\d+)d(\d+)/i);

  if (!match) {
    return null;
  }

  return {
    count: Number(match[1]),
    sides: Number(match[2]),
  };
}

export function EncounterCombatRolls({
  participant,
  character,
  monster,
  items,
}: {
  participant: CampaignEncounterParticipant;
  character?: Character;
  monster?: DndMonsterData;
  items: DndItemData[];
}) {
  const [history, setHistory] = useState<CombatRollEntry[]>([]);

  const monsterActions = useMemo(
    () => (monster?.actions ?? []).map(parseMonsterAction),
    [monster],
  );

  const equippedWeapons = useMemo(() => {
    if (!character) {
      return [];
    }

    return character.equippedWeaponIds
      .map((weaponId) => items.find((item) => item.id === weaponId))
      .filter((item): item is DndItemData => Boolean(item));
  }, [character, items]);

  function addRoll(
    label: string,
    count: number,
    sides: number,
    modifier: number,
  ) {
    const result = rollDice({ count, sides, modifier });
    const detail = `${result.rolls.join(" + ")}${
      modifier === 0 ? "" : modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`
    }`;

    setHistory((current) => [
      {
        id: result.id,
        label,
        notation: result.notation,
        total: result.total,
        detail,
        createdAt: result.createdAt,
      },
      ...current,
    ].slice(0, 8));
  }

  return (
    <div className="encounter-combat-rolls">
      <div className="encounter-combat-rolls-head">
        <div>
          <span className="mini-label">Combat Rolls</span>
          <strong>{participant.name}</strong>
        </div>
        {history.length > 0 && (
          <button type="button" onClick={() => setHistory([])}>
            Geçmişi Temizle
          </button>
        )}
      </div>

      {monster ? (
        <div className="encounter-action-roll-list">
          {monsterActions.length === 0 ? (
            <p>Bu yaratığın kayıtlı aksiyonu yok. Muhtemelen bakarak hasar veriyor.</p>
          ) : (
            monsterActions.map((action, index) => (
              <div className="encounter-action-roll-card" key={`${action.name}-${index}`}>
                <div>
                  <strong>{action.name}</strong>
                  <small>{action.raw}</small>
                </div>
                <div className="encounter-roll-buttons">
                  {action.attackBonus !== null && (
                    <button
                      type="button"
                      onClick={() => addRoll(`${action.name} Attack`, 1, 20, action.attackBonus ?? 0)}
                    >
                      Attack {action.attackBonus >= 0 ? `+${action.attackBonus}` : action.attackBonus}
                    </button>
                  )}
                  {action.damageCount !== null && action.damageSides !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        addRoll(
                          `${action.name} Damage`,
                          action.damageCount ?? 1,
                          action.damageSides ?? 6,
                          action.damageModifier,
                        )
                      }
                    >
                      Damage {action.damageCount}d{action.damageSides}
                      {action.damageModifier === 0
                        ? ""
                        : action.damageModifier > 0
                          ? `+${action.damageModifier}`
                          : action.damageModifier}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : character ? (
        <>
          <div className="encounter-check-grid">
            {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => {
              const modifier = getMonsterAbilityModifier(character.abilities[ability]);
              return (
                <button
                  type="button"
                  key={ability}
                  onClick={() => addRoll(`${ABILITY_LABELS[ability]} Check`, 1, 20, modifier)}
                >
                  {ABILITY_LABELS[ability]} {modifier >= 0 ? `+${modifier}` : modifier}
                </button>
              );
            })}
          </div>

          {equippedWeapons.length > 0 && (
            <div className="encounter-action-roll-list">
              {equippedWeapons.map((weapon) => {
                const ability = getWeaponAbility(character, weapon);
                const abilityModifier = getMonsterAbilityModifier(character.abilities[ability]);
                const attackBonus = getProficiencyBonus(character.level) + abilityModifier;
                const damageDice = parseDamageDice(weapon.damage);

                return (
                  <div className="encounter-action-roll-card" key={weapon.id}>
                    <div>
                      <strong>{weapon.name}</strong>
                      <small>
                        {ABILITY_LABELS[ability]} tabanlı • {weapon.damage ?? "Hasar zarı yok"}
                        {weapon.damageType ? ` ${weapon.damageType}` : ""}
                      </small>
                    </div>
                    <div className="encounter-roll-buttons">
                      <button
                        type="button"
                        onClick={() => addRoll(`${weapon.name} Attack`, 1, 20, attackBonus)}
                      >
                        Attack {attackBonus >= 0 ? `+${attackBonus}` : attackBonus}
                      </button>
                      {damageDice && (
                        <button
                          type="button"
                          onClick={() =>
                            addRoll(
                              `${weapon.name} Damage`,
                              damageDice.count,
                              damageDice.sides,
                              abilityModifier,
                            )
                          }
                        >
                          Damage {damageDice.count}d{damageDice.sides}
                          {abilityModifier === 0
                            ? ""
                            : abilityModifier > 0
                              ? `+${abilityModifier}`
                              : abilityModifier}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <p>Kaynak kayıt bulunamadı. Participant var, geçmişi yok. Bürokratik hayalet.</p>
      )}

      {history.length > 0 && (
        <div className="encounter-roll-history">
          {history.map((entry) => (
            <article key={entry.id}>
              <div>
                <strong>{entry.label}</strong>
                <span>{entry.notation} • {entry.detail}</span>
              </div>
              <b>{entry.total}</b>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
