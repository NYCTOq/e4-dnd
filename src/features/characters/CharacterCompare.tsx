import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AbilityKey, Character } from "../../core/character/character.types";
import {
  formatModifier,
  getAbilityModifier,
  getInitiative,
  getPassivePerception,
  getProficiencyBonus,
  getSpellAttackBonus,
  getSpellSaveDc,
} from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function getTotalInventoryQuantity(character: Character) {
  return character.inventory.reduce((total, item) => total + item.quantity, 0);
}

function DifferenceValue({ left, right }: { left: string | number; right: string | number }) {
  const different = left !== right;

  return (
    <>
      <div className={different ? "compare-value different" : "compare-value"}>{left}</div>
      <div className={different ? "compare-value different" : "compare-value"}>{right}</div>
    </>
  );
}

export function CharacterCompare({ characters }: { characters: Character[] }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  const leftId = ids[0] ?? characters[0]?.id ?? "";
  const rightId = ids[1] ?? characters.find((character) => character.id !== leftId)?.id ?? "";

  const left = useMemo(
    () => characters.find((character) => character.id === leftId) ?? null,
    [characters, leftId],
  );
  const right = useMemo(
    () => characters.find((character) => character.id === rightId) ?? null,
    [characters, rightId],
  );

  function updateSelection(nextLeftId: string, nextRightId: string) {
    setSearchParams({ ids: [nextLeftId, nextRightId].filter(Boolean).join(",") });
  }

  if (characters.length < 2) {
    return (
      <PageShell
        eyebrow="Build Lab"
        title="Karakter KarÅŸÄ±laÅŸtÄ±r"
        description="KarÅŸÄ±laÅŸtÄ±rma iÃ§in en az iki karakter gerekiyor. Tek karakterle dÃ¼ello yapmak biraz fazla iÃ§sel kalÄ±yor."
      >
        <div className="empty-panel">
          <h2>Ä°kinci karakter gerekli.</h2>
          <p>Karakter listesinden mevcut karakteri kopyalayabilir veya Builder ile yeni bir tane oluÅŸturabilirsin.</p>
          <button type="button" onClick={() => navigate("/characters")}>Karakterlere dÃ¶n</button>
        </div>
      </PageShell>
    );
  }

  if (!left || !right) {
    return null;
  }

  return (
    <PageShell
      eyebrow="Build Lab"
      title="Karakter KarÅŸÄ±laÅŸtÄ±r"
      description="Ä°ki karakteri temel istatistikler, yetenek skorlarÄ±, bÃ¼yÃ¼ler ve ekipman aÃ§Ä±sÄ±ndan yan yana incele. FarklÄ± deÄŸerler vurgulanÄ±r."
    >
      <div className="compare-picker-panel">
        <label>
          Sol karakter
          <select
            value={left.id}
            onChange={(event) => updateSelection(event.target.value, right.id)}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id} disabled={character.id === right.id}>
                {character.name} â€¢ Lv. {character.level}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="compare-swap-button"
          onClick={() => updateSelection(right.id, left.id)}
          aria-label="Karakterlerin yerini deÄŸiÅŸtir"
        >
          â‡„
        </button>

        <label>
          SaÄŸ karakter
          <select
            value={right.id}
            onChange={(event) => updateSelection(left.id, event.target.value)}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id} disabled={character.id === left.id}>
                {character.name} â€¢ Lv. {character.level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-hero-grid">
        {[left, right].map((character) => (
          <article className="compare-hero-card" key={character.id}>
            <span className="mini-label">{character.ruleset}</span>
            <h2>{character.name}</h2>
            <p>
              {character.race || "Unknown Race"} â€¢ {character.className || "Unknown Class"}
              {character.subclass ? ` â€¢ ${character.subclass}` : ""}
            </p>
            <button type="button" onClick={() => navigate(`/characters/${character.id}`)}>
              Karakteri aÃ§
            </button>
          </article>
        ))}
      </div>

      <section className="compare-section">
        <h2>Temel savaÅŸ deÄŸerleri</h2>
        <div className="compare-table">
          <div className="compare-label">Seviye</div>
          <DifferenceValue left={left.level} right={right.level} />
          <div className="compare-label">HP</div>
          <DifferenceValue left={`${left.currentHp}/${left.maxHp}`} right={`${right.currentHp}/${right.maxHp}`} />
          <div className="compare-label">Temp HP</div>
          <DifferenceValue left={left.tempHp} right={right.tempHp} />
          <div className="compare-label">AC</div>
          <DifferenceValue left={left.armorClass} right={right.armorClass} />
          <div className="compare-label">Initiative</div>
          <DifferenceValue left={formatModifier(getInitiative(left))} right={formatModifier(getInitiative(right))} />
          <div className="compare-label">Proficiency</div>
          <DifferenceValue left={`+${getProficiencyBonus(left.level)}`} right={`+${getProficiencyBonus(right.level)}`} />
          <div className="compare-label">Passive Perception</div>
          <DifferenceValue left={getPassivePerception(left)} right={getPassivePerception(right)} />
          <div className="compare-label">Spell Save DC</div>
          <DifferenceValue left={getSpellSaveDc(left)} right={getSpellSaveDc(right)} />
          <div className="compare-label">Spell Attack</div>
          <DifferenceValue left={formatModifier(getSpellAttackBonus(left))} right={formatModifier(getSpellAttackBonus(right))} />
        </div>
      </section>

      <section className="compare-section">
        <h2>Ability skorlarÄ±</h2>
        <div className="compare-ability-grid">
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => {
            const leftScore = left.abilities[ability];
            const rightScore = right.abilities[ability];
            const different = leftScore !== rightScore;

            return (
              <article className={different ? "compare-ability-card different" : "compare-ability-card"} key={ability}>
                <strong>{ABILITY_LABELS[ability]}</strong>
                <div>
                  <span>{leftScore}</span>
                  <small>{formatModifier(getAbilityModifier(leftScore))}</small>
                </div>
                <div>
                  <span>{rightScore}</span>
                  <small>{formatModifier(getAbilityModifier(rightScore))}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="compare-section">
        <h2>Kaynaklar ve iÃ§erik</h2>
        <div className="compare-table">
          <div className="compare-label">Bilinen bÃ¼yÃ¼</div>
          <DifferenceValue left={left.knownSpellIds.length} right={right.knownSpellIds.length} />
          <div className="compare-label">HazÄ±r bÃ¼yÃ¼</div>
          <DifferenceValue left={left.preparedSpellIds.length} right={right.preparedSpellIds.length} />
          <div className="compare-label">Toplam spell slot</div>
          <DifferenceValue
            left={left.spellSlots.reduce((total, slot) => total + slot.max, 0)}
            right={right.spellSlots.reduce((total, slot) => total + slot.max, 0)}
          />
          <div className="compare-label">Inventory adedi</div>
          <DifferenceValue left={getTotalInventoryQuantity(left)} right={getTotalInventoryQuantity(right)} />
          <div className="compare-label">KuÅŸanÄ±lmÄ±ÅŸ silah</div>
          <DifferenceValue left={left.equippedWeaponIds.length} right={right.equippedWeaponIds.length} />
          <div className="compare-label">Gold</div>
          <DifferenceValue left={left.gold} right={right.gold} />
          <div className="compare-label">Condition</div>
          <DifferenceValue left={left.conditions.length} right={right.conditions.length} />
          <div className="compare-label">Exhaustion</div>
          <DifferenceValue left={left.exhaustion} right={right.exhaustion} />
        </div>
      </section>
    </PageShell>
  );
}

