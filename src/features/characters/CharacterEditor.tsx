import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Character, CharacterDraft } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellAttackBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { CharacterInventoryManager, CharacterSpellSelector, calculateEffectiveArmorClass, createCharacterFromDraft, emptyDraft, normalizeHitDice, normalizeSpellSlots } from "./characterShared";

export function CharacterEditor({
  characters,
  onUpdateCharacter,
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  characters: Character[];
  onUpdateCharacter: (character: Character) => void;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const character = characters.find((item) => item.id === characterId);

  const [draft, setDraft] = useState<CharacterDraft>(emptyDraft);

  useEffect(() => {
    if (!character) {
      return;
    }

    setDraft({
      name: character.name,
      playerName: character.playerName,
      ruleset: character.ruleset,
      race: character.race,
      className: character.className,
      subclass: character.subclass,
      background: character.background,
      level: character.level,
      abilities: character.abilities,
      maxHp: character.maxHp,
      armorClass: character.armorClass,
      armorClassMode: character.armorClassMode === "auto" ? "auto" : "manual",
      knownSpellIds: character.knownSpellIds ?? [],
      preparedSpellIds: character.preparedSpellIds ?? [],
      spellSlots: normalizeSpellSlots(
        character.spellSlots,
        character.level,
        character.className,
      ),
      inventory: character.inventory ?? [],
      equippedArmorId: character.equippedArmorId ?? null,
      equippedShieldId: character.equippedShieldId ?? null,
      equippedWeaponIds: character.equippedWeaponIds ?? [],
      gold: character.gold ?? 0,
      deathSaves: character.deathSaves ?? { successes: 0, failures: 0 },
      hitDice: normalizeHitDice(
        character.hitDice,
        character.level,
        character.className,
      ),
      exhaustion: character.exhaustion ?? 0,
      conditionDurations: character.conditionDurations ?? {},
      notes: character.notes,
    });
  }, [character]);

  const selectedRace = useMemo(() => {
    return rulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [rulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      rulesetData?.classes.find(
        (classItem) => classItem.name === draft.className,
      ) ?? null
    );
  }, [rulesetData, draft.className]);

  function updateDraft<K extends keyof CharacterDraft>(
    key: K,
    value: CharacterDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbility(
    ability: keyof CharacterDraft["abilities"],
    value: number,
  ) {
    setDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!character) {
      return;
    }

    if (!draft.name.trim()) {
      alert("Karakter adÄ± lazÄ±m kankam. Ä°simsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seÃ§meden karakter olmaz. Sistem bile buna gÃ¼ler.");
      return;
    }

    const updatedCharacter: Character = {
      ...character,
      ...draft,
      armorClass: calculateEffectiveArmorClass(draft, rulesetData?.items),
      currentHp: Math.min(character.currentHp, draft.maxHp),
      spellSlots: normalizeSpellSlots(
        draft.spellSlots,
        draft.level,
        draft.className,
      ),
      hitDice: normalizeHitDice(
        draft.hitDice,
        draft.level,
        draft.className,
      ),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCharacter(updatedCharacter);
    navigate(`/characters/${character.id}`);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft],
  );

  if (!character) {
    return (
      <PageShell
        eyebrow="Character Editor"
        title="Karakter BulunamadÄ±"
        description="DÃ¼zenlenecek karakter ya silindi ya da Git conflict gÃ¶rÃ¼p kaÃ§tÄ±."
      >
        <button
          className="primary-action"
          onClick={() => navigate("/characters")}
        >
          Karakterlere DÃ¶n
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Character Editor"
      title={`${character.name} DÃ¼zenle`}
      description="Karakter bilgilerini gÃ¼ncelle. D&D karakterleri zaten sabit kalmaz, oyuncular da durduk yere fikir deÄŸiÅŸtirir."
    >
      <form className="builder-form" onSubmit={handleSubmit}>
        <section className="form-panel">
          <h2>Temel Bilgiler</h2>

          <div className="form-grid">
            <label>
              Karakter AdÄ±
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Sora, Tengiz, Akai..."
              />
            </label>

            <label>
              Oyuncu
              <input
                value={draft.playerName}
                onChange={(event) =>
                  updateDraft("playerName", event.target.value)
                }
                placeholder="Oyuncu adÄ±"
              />
            </label>

            <label>
              Ruleset
              <select
                value={draft.ruleset}
                onChange={(event) =>
                  updateDraft(
                    "ruleset",
                    event.target.value as CharacterDraft["ruleset"],
                  )
                }
              >
                <option value="dnd_2014">D&D 2014</option>
                <option value="dnd_2024">D&D 2024</option>
                <option value="homebrew">Homebrew</option>
              </select>
            </label>

            <label>
              Level
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={(event) =>
                  updateDraft("level", Number(event.target.value))
                }
              />
            </label>

            <label>
              Race
              {draft.ruleset === "dnd_2014" ? (
                <select
                  value={draft.race}
                  disabled={isRulesetLoading || !!rulesetError || !rulesetData}
                  onChange={(event) => updateDraft("race", event.target.value)}
                >
                  <option value="">
                    {isRulesetLoading ? "Race data yÃ¼kleniyor..." : "Race seÃ§"}
                  </option>

                  {rulesetData?.races.map((race) => (
                    <option key={race.id} value={race.name}>
                      {race.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.race}
                  onChange={(event) => updateDraft("race", event.target.value)}
                  placeholder="Custom race..."
                />
              )}
            </label>

            <label>
              Class
              {draft.ruleset === "dnd_2014" ? (
                <select
                  value={draft.className}
                  disabled={isRulesetLoading || !!rulesetError || !rulesetData}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                >
                  <option value="">
                    {isRulesetLoading
                      ? "Class data yÃ¼kleniyor..."
                      : "Class seÃ§"}
                  </option>

                  {rulesetData?.classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.name}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.className}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                  placeholder="Custom class..."
                />
              )}
            </label>

            <label>
              Subclass
              <input
                value={draft.subclass}
                onChange={(event) =>
                  updateDraft("subclass", event.target.value)
                }
                placeholder="Desert Domain..."
              />
            </label>

            <label>
              Background
              <input
                value={draft.background}
                onChange={(event) =>
                  updateDraft("background", event.target.value)
                }
                placeholder="Acolyte, Sailor..."
              />
            </label>
          </div>

          {rulesetError ? (
            <div className="empty-panel">
              <h2>Ruleset data yÃ¼klenemedi</h2>
              <p>{rulesetError}</p>
            </div>
          ) : null}

          {selectedRace || selectedClass ? (
            <div className="preview-stats">
              {selectedRace ? (
                <>
                  <span>Race: {selectedRace.name}</span>
                  <span>Speed {selectedRace.speed} ft</span>
                  <span>Size {selectedRace.size}</span>
                  <span>
                    Bonus{" "}
                    {Object.entries(selectedRace.abilityBonuses)
                      .map(
                        ([ability, bonus]) =>
                          `${ability.toUpperCase()} +${bonus}`,
                      )
                      .join(", ")}
                  </span>
                </>
              ) : null}

              {selectedClass ? (
                <>
                  <span>Class: {selectedClass.name}</span>
                  <span>Hit Die d{selectedClass.hitDie}</span>
                  <span>
                    Saves{" "}
                    {selectedClass.savingThrows
                      .map((save) => save.toUpperCase())
                      .join(", ")}
                  </span>
                  <span>
                    Spell{" "}
                    {selectedClass.spellcastingAbility
                      ? selectedClass.spellcastingAbility.toUpperCase()
                      : "None"}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="form-panel">
          <h2>Ability Scores</h2>

          <div className="ability-editor">
            {Object.entries(draft.abilities).map(([ability, score]) => (
              <label className="ability-input" key={ability}>
                <span>{ability.toUpperCase()}</span>

                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(event) =>
                    updateAbility(
                      ability as keyof CharacterDraft["abilities"],
                      Number(event.target.value),
                    )
                  }
                />

                <strong>{formatModifier(getAbilityModifier(score))}</strong>
              </label>
            ))}
          </div>
        </section>

        <section className="form-panel">
          <h2>Combat</h2>

          <div className="form-grid">
            <label>
              Max HP
              <input
                type="number"
                min={1}
                value={draft.maxHp}
                onChange={(event) =>
                  updateDraft("maxHp", Number(event.target.value))
                }
              />
            </label>

            <label>
              Armor Class
              <input
                type="number"
                min={1}
                value={draft.armorClass}
                onChange={(event) =>
                  updateDraft("armorClass", Number(event.target.value))
                }
              />
            </label>
          </div>

          <label>
            Notlar
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Lore, Ã¶zel homebrew kurallar, DM notlarÄ±..."
              rows={4}
            />
          </label>
        </section>

        <CharacterSpellSelector
          title="Karakter Spellbook"
          description="Bu karakterin spell listesini gÃ¼ncelle. Oyuncular zaten her seviye atlayÄ±nca kimlik krizi geÃ§iriyor."
          rulesetData={rulesetData}
          isRulesetLoading={isRulesetLoading}
          rulesetError={rulesetError}
          className={draft.className}
          knownSpellIds={draft.knownSpellIds}
          preparedSpellIds={draft.preparedSpellIds}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              knownSpellIds: next.knownSpellIds,
              preparedSpellIds: next.preparedSpellIds,
            }))
          }
        />

        <CharacterInventoryManager
          title="Inventory & Equipment"
          description="Karakterin itemlarÄ±nÄ± ve kuÅŸandÄ±ÄŸÄ± ekipmanÄ± gÃ¼ncelle. Ã‡anta yÃ¶netimi, kahramanlÄ±ÄŸÄ±n en az havalÄ± ama en gerekli tarafÄ±."
          rulesetData={rulesetData}
          isRulesetLoading={isRulesetLoading}
          rulesetError={rulesetError}
          inventory={draft.inventory}
          equippedArmorId={draft.equippedArmorId}
          equippedShieldId={draft.equippedShieldId}
          equippedWeaponIds={draft.equippedWeaponIds}
          gold={draft.gold}
          abilities={draft.abilities}
          armorClass={draft.armorClass}
          armorClassMode={draft.armorClassMode}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              inventory: next.inventory,
              equippedArmorId: next.equippedArmorId,
              equippedShieldId: next.equippedShieldId,
              equippedWeaponIds: next.equippedWeaponIds,
              gold: next.gold,
              armorClass: next.armorClass,
              armorClassMode: next.armorClassMode,
            }))
          }
        />

        <section className="form-panel preview-panel">
          <h2>Ã–nizleme</h2>

          <div className="preview-stats">
            <span>PB +{getProficiencyBonus(previewCharacter.level)}</span>
            <span>AC {calculateEffectiveArmorClass(draft, rulesetData?.items)}</span>
            <span>HP {previewCharacter.maxHp}</span>
            <span>Init {formatModifier(getInitiative(previewCharacter))}</span>
            <span>PP {getPassivePerception(previewCharacter)}</span>
            <span>DC {getSpellSaveDc(previewCharacter)}</span>
            <span>
              Spell Attack{" "}
              {formatModifier(getSpellAttackBonus(previewCharacter))}
            </span>
          </div>

          <div className="character-actions">
            <button className="primary-action" type="submit">
              DeÄŸiÅŸiklikleri Kaydet
            </button>

            <button
              type="button"
              onClick={() => navigate(`/characters/${character.id}`)}
            >
              VazgeÃ§
            </button>
          </div>
        </section>
      </form>
    </PageShell>
  );
}


