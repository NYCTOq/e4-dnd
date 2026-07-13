import { useMemo, useState } from "react";
import type { Character, AbilityKey } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getAbilityModifier, getProficiencyBonus } from "../../core/character/characterCalculator";
import { rollDice } from "../../core/dice/diceRoller";
import { normalizeHitDice, normalizeSpellSlots } from "./characterShared";

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

type HpMode = "average" | "roll" | "manual";
type AsiMode = "none" | "plus-two" | "split";

function isAsiMilestone(level: number) {
  return [4, 8, 12, 16, 19].includes(level);
}

export function LevelUpAssistant({
  character,
  rulesetData,
  onUpdateCharacter,
}: {
  character: Character;
  rulesetData: RulesetData | null;
  onUpdateCharacter: (character: Character) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hpMode, setHpMode] = useState<HpMode>("average");
  const [manualHp, setManualHp] = useState(1);
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  const [asiMode, setAsiMode] = useState<AsiMode>("none");
  const [primaryAbility, setPrimaryAbility] = useState<AbilityKey>("str");
  const [secondaryAbility, setSecondaryAbility] = useState<AbilityKey>("dex");

  const nextLevel = Math.min(20, character.level + 1);
  const selectedClass = rulesetData?.classes.find(
    (classItem) => classItem.name === character.className,
  );
  const hitDie = selectedClass?.hitDie ?? 8;
  const conModifier = getAbilityModifier(character.abilities.con);
  const averageHpGain = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);
  const currentProficiency = getProficiencyBonus(character.level);
  const nextProficiency = getProficiencyBonus(nextLevel);
  const asiAvailable = isAsiMilestone(nextLevel);

  const hpGain = useMemo(() => {
    if (hpMode === "manual") {
      return Math.max(1, Math.floor(manualHp || 1));
    }

    if (hpMode === "roll") {
      return rolledHp ?? Math.max(1, 1 + conModifier);
    }

    return averageHpGain;
  }, [averageHpGain, conModifier, hpMode, manualHp, rolledHp]);

  function rollLevelHp() {
    const result = rollDice({ count: 1, sides: hitDie, modifier: conModifier });
    setRolledHp(Math.max(1, result.total));
  }

  function applyAbilityIncrease(abilities: Character["abilities"]) {
    if (!asiAvailable || asiMode === "none") {
      return abilities;
    }

    const nextAbilities = { ...abilities };

    if (asiMode === "plus-two") {
      nextAbilities[primaryAbility] = Math.min(20, nextAbilities[primaryAbility] + 2);
      return nextAbilities;
    }

    nextAbilities[primaryAbility] = Math.min(20, nextAbilities[primaryAbility] + 1);
    nextAbilities[secondaryAbility] = Math.min(20, nextAbilities[secondaryAbility] + 1);
    return nextAbilities;
  }

  function confirmLevelUp() {
    if (character.level >= 20) {
      return;
    }

    const nextAbilities = applyAbilityIncrease(character.abilities);
    const nextCharacter: Character = {
      ...character,
      level: nextLevel,
      abilities: nextAbilities,
      maxHp: character.maxHp + hpGain,
      currentHp: Math.min(character.maxHp + hpGain, character.currentHp + hpGain),
      spellSlots: normalizeSpellSlots(
        character.spellSlots,
        nextLevel,
        character.className,
      ),
      hitDice: normalizeHitDice(
        character.hitDice,
        nextLevel,
        character.className,
        hitDie,
      ),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCharacter(nextCharacter);
    setIsOpen(false);
    setRolledHp(null);
    setAsiMode("none");
  }

  if (character.level >= 20) {
    return (
      <div className="level-up-launch-card level-cap-card">
        <div>
          <span className="mini-label">Level Up Assistant</span>
          <strong>Level 20</strong>
          <p>Karakter seviye sınırında. Bundan sonrası destan, homebrew veya DM’in sabrına bağlı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="level-up-launch-card">
      <div>
        <span className="mini-label">Level Up Assistant</span>
        <strong>Level {character.level} → {nextLevel}</strong>
        <p>HP, proficiency, hit dice ve spell slot güncellemelerini kontrollü biçimde uygula.</p>
      </div>

      <button type="button" onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? "Kapat" : "Level Up"}
      </button>

      {isOpen ? (
        <div className="level-up-panel">
          <div className="level-up-summary-grid">
            <div>
              <span>Yeni Seviye</span>
              <strong>{nextLevel}</strong>
            </div>
            <div>
              <span>Proficiency</span>
              <strong>+{currentProficiency} → +{nextProficiency}</strong>
            </div>
            <div>
              <span>Hit Die</span>
              <strong>d{hitDie}</strong>
            </div>
            <div>
              <span>HP Artışı</span>
              <strong>+{hpGain}</strong>
            </div>
          </div>

          <section className="level-up-section">
            <div className="panel-heading-row">
              <div>
                <span className="mini-label">Hit Points</span>
                <h3>HP artışını seç</h3>
              </div>
            </div>

            <div className="level-up-choice-grid">
              <button
                type="button"
                className={hpMode === "average" ? "active" : ""}
                onClick={() => setHpMode("average")}
              >
                Ortalama +{averageHpGain}
              </button>
              <button
                type="button"
                className={hpMode === "roll" ? "active" : ""}
                onClick={() => setHpMode("roll")}
              >
                Zar At d{hitDie}
              </button>
              <button
                type="button"
                className={hpMode === "manual" ? "active" : ""}
                onClick={() => setHpMode("manual")}
              >
                Manuel
              </button>
            </div>

            {hpMode === "roll" ? (
              <div className="level-up-inline-control">
                <button type="button" onClick={rollLevelHp}>HP Zarı At</button>
                <strong>{rolledHp === null ? "Henüz atılmadı" : `Sonuç: +${rolledHp} HP`}</strong>
              </div>
            ) : null}

            {hpMode === "manual" ? (
              <label className="level-up-manual-field">
                HP artışı
                <input
                  type="number"
                  min={1}
                  value={manualHp}
                  onChange={(event) => setManualHp(Number(event.target.value))}
                />
              </label>
            ) : null}
          </section>

          {asiAvailable ? (
            <section className="level-up-section">
              <div className="panel-heading-row">
                <div>
                  <span className="mini-label">Ability Score Improvement</span>
                  <h3>ASI veya feat tercihi</h3>
                  <p>Feat seçiyorsan ability artışını uygulama ve feat’i karakter notlarına ekle.</p>
                </div>
              </div>

              <div className="level-up-choice-grid">
                <button type="button" className={asiMode === "none" ? "active" : ""} onClick={() => setAsiMode("none")}>Feat / Sonra</button>
                <button type="button" className={asiMode === "plus-two" ? "active" : ""} onClick={() => setAsiMode("plus-two")}>Bir Yeteneğe +2</button>
                <button type="button" className={asiMode === "split" ? "active" : ""} onClick={() => setAsiMode("split")}>İki Yeteneğe +1</button>
              </div>

              {asiMode !== "none" ? (
                <div className="level-up-ability-selects">
                  <label>
                    Birinci yetenek
                    <select value={primaryAbility} onChange={(event) => setPrimaryAbility(event.target.value as AbilityKey)}>
                      {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => (
                        <option key={ability} value={ability}>{ABILITY_LABELS[ability]} ({character.abilities[ability]})</option>
                      ))}
                    </select>
                  </label>

                  {asiMode === "split" ? (
                    <label>
                      İkinci yetenek
                      <select value={secondaryAbility} onChange={(event) => setSecondaryAbility(event.target.value as AbilityKey)}>
                        {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => (
                          <option key={ability} value={ability}>{ABILITY_LABELS[ability]} ({character.abilities[ability]})</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="level-up-section level-up-checklist">
            <span className="mini-label">Kontrol Listesi</span>
            <ul>
              <li>Class ve subclass özelliklerini kaynak kitaptan kontrol et.</li>
              <li>Yeni spell, cantrip veya prepared spell hakkını kontrol et.</li>
              <li>{nextProficiency > currentProficiency ? "Proficiency bonus bu seviyede otomatik artacak." : "Proficiency bonus bu seviyede değişmiyor."}</li>
              <li>Hit dice havuzu ve bilinen spell slot tablosu otomatik güncellenecek.</li>
              {nextLevel === 3 ? <li>Subclass seçimi çoğu class için bu seviyede gündeme gelir.</li> : null}
              {asiAvailable ? <li>Bu seviye genel ASI kilometre taşıdır; bazı class’lar farklı ilerleyebilir.</li> : null}
            </ul>
          </section>

          <div className="level-up-confirm-bar">
            <div>
              <strong>Level {nextLevel}</strong>
              <span>Maksimum HP +{hpGain}</span>
            </div>
            <button type="button" className="primary-action" onClick={confirmLevelUp}>Level Up Uygula</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
