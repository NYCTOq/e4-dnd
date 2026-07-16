import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { getRulesetDefinition } from "../../core/rulesets/rulesetRegistry";
import { getAlwaysPreparedSpells } from "../../core/rulesets/subclassRules";
import { getHighestSpellLevel } from "../../core/rulesets/spellRules";
import { useSelectedRuleset } from "../../core/rulesets/useSelectedRuleset";
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
  const selectedRuleset = useSelectedRuleset(draft.ruleset, rulesetData);
  const activeRulesetData = selectedRuleset.data;
  const activeRulesetLoading = selectedRuleset.loading || (draft.ruleset === rulesetData?.id && isRulesetLoading);
  const activeRulesetError = selectedRuleset.error ?? (draft.ruleset === rulesetData?.id ? rulesetError : null);
  const rulesetDefinition = getRulesetDefinition(draft.ruleset);

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
      featIds: character.featIds ?? [],
      fightingStyleIds: character.fightingStyleIds ?? [],
      masteredWeaponIds: character.masteredWeaponIds ?? [],
      metamagicIds: character.metamagicIds ?? [],
      invocationIds: character.invocationIds ?? [],
      wildShapeFormIds: character.wildShapeFormIds ?? [],
      maneuverIds: character.maneuverIds ?? [],
      companionId: character.companionId,
      companionCurrentHp: character.companionCurrentHp,
      arcanumSpellIds: character.arcanumSpellIds ?? [],
      usedArcanumSpellIds: character.usedArcanumSpellIds ?? [],
      skillProficiencies: character.skillProficiencies ?? [],
      expertiseSkills: character.expertiseSkills ?? [],
      toolProficiencies: character.toolProficiencies ?? [],
      languages: character.languages ?? [],
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
    return activeRulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [activeRulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      activeRulesetData?.classes.find(
        (classItem) => classItem.name === draft.className,
      ) ?? null
    );
  }, [activeRulesetData, draft.className]);
  const selectedSubclass = useMemo(() => activeRulesetData?.subclasses.find((item) => item.name === draft.subclass && item.className === draft.className) ?? null, [activeRulesetData, draft.subclass, draft.className]);
  const alwaysPreparedSpells = useMemo(() => getAlwaysPreparedSpells(selectedSubclass, getHighestSpellLevel(selectedClass ?? undefined, draft.level), activeRulesetData?.spells ?? []), [selectedSubclass, selectedClass, draft.level, activeRulesetData]);

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
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      return;
    }

    const updatedCharacter: Character = {
      ...character,
      ...draft,
      knownSpellIds: [...new Set([...draft.knownSpellIds, ...alwaysPreparedSpells.map((spell) => spell.id)])],
      preparedSpellIds: [...new Set([...draft.preparedSpellIds, ...alwaysPreparedSpells.map((spell) => spell.id)])],
      armorClass: calculateEffectiveArmorClass(draft, activeRulesetData?.items),
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
        title="Karakter Bulunamadı"
        description="Düzenlenecek karakter ya silindi ya da Git conflict görüp kaçtı."
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

  return (
    <PageShell
      eyebrow="Character Editor"
      title={`${character.name} Düzenle`}
      description="Karakter bilgilerini güncelle. D&D karakterleri zaten sabit kalmaz, oyuncular da durduk yere fikir değiştirir."
    >
      <form className="builder-form" onSubmit={handleSubmit}>
        <section className="form-panel">
          <h2>Temel Bilgiler</h2>

          <div className="form-grid">
            <label>
              Karakter Adı
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
                placeholder="Oyuncu adı"
              />
            </label>

            <label>
              Ruleset
              <select
                value={draft.ruleset}
                onChange={(event) => {
                  const nextRuleset = event.target.value as CharacterDraft["ruleset"];
                  setDraft((current) => ({ ...current, ruleset: nextRuleset, race: "", className: "", subclass: "", background: "", knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [] }));
                }}
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
              {draft.ruleset !== "homebrew" ? (
                <select
                  value={draft.race}
                  disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                  onChange={(event) => updateDraft("race", event.target.value)}
                >
                  <option value="">
                    {activeRulesetLoading ? `${rulesetDefinition.raceTerm} data yükleniyor...` : `${rulesetDefinition.raceTerm} seç`}
                  </option>

                  {activeRulesetData?.races.map((race) => (
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
              {draft.ruleset !== "homebrew" ? (
                <select
                  value={draft.className}
                  disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                >
                  <option value="">
                    {activeRulesetLoading
                      ? "Class data yükleniyor..."
                      : "Class seç"}
                  </option>

                  {activeRulesetData?.classes.map((classItem) => (
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

          {activeRulesetError ? (
            <div className="empty-panel">
              <h2>Ruleset data yüklenemedi</h2>
              <p>{activeRulesetError}</p>
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
                  max={20}
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
              placeholder="Lore, özel homebrew kurallar, DM notları..."
              rows={4}
            />
          </label>
        </section>

        <CharacterSpellSelector
          title="Karakter Spellbook"
          description="Bu karakterin spell listesini güncelle. Oyuncular zaten her seviye atlayınca kimlik krizi geçiriyor."
          rulesetData={activeRulesetData}
          isRulesetLoading={activeRulesetLoading}
          rulesetError={activeRulesetError}
          className={draft.className}
          characterLevel={draft.level}
          abilities={draft.abilities}
          knownSpellIds={draft.knownSpellIds}
          preparedSpellIds={draft.preparedSpellIds}
          alwaysPreparedSpellIds={alwaysPreparedSpells.map((spell) => spell.id)}
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
          description="Karakterin itemlarını ve kuşandığı ekipmanı güncelle. Çanta yönetimi, kahramanlığın en az havalı ama en gerekli tarafı."
          rulesetData={activeRulesetData}
          isRulesetLoading={activeRulesetLoading}
          rulesetError={activeRulesetError}
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
          <h2>Önizleme</h2>

          <div className="preview-stats">
            <span>PB +{getProficiencyBonus(previewCharacter.level)}</span>
            <span>AC {calculateEffectiveArmorClass(draft, activeRulesetData?.items)}</span>
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
              Değişiklikleri Kaydet
            </button>

            <button
              type="button"
              onClick={() => navigate(`/characters/${character.id}`)}
            >
              Vazgeç
            </button>
          </div>
        </section>
      </form>
    </PageShell>
  );
}
