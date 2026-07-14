import { useMemo, useState } from "react";
import { AutosaveStatus } from "../../shared/forms/AutosaveStatus";
import { useAutosavedDraft } from "../../shared/state/useAutosavedDraft";
import type { RulesetData, DndSpellData } from "../../core/rulesets/ruleset.types";
import type { CharacterDraft } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { CharacterInventoryManager, CharacterSpellSelector, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getInventoryWeight } from "../characters/characterShared";

export function Builder({
  onCreateCharacter,
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  onCreateCharacter: (draft: CharacterDraft) => void;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const {
    value: draft,
    setValue: setDraft,
    clearDraft,
    lastSavedAt,
    restoredAt,
  } = useAutosavedDraft<CharacterDraft>(
    "e4_dnd_draft_character_builder_v1",
    emptyDraft,
    {
      isMeaningful: (value) =>
        Boolean(
          value.name.trim() ||
            value.playerName.trim() ||
            value.className.trim() ||
            value.race.trim() ||
            value.notes.trim() ||
            value.knownSpellIds.length ||
            value.inventory.length,
        ),
    },
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const builderSteps = [
    { id: "basic", title: "Basic", description: "İsim, oyuncu ve temel kimlik." },
    { id: "class", title: "Race & Class", description: "Tür, sınıf, seviye ve arka plan." },
    { id: "abilities", title: "Abilities", description: "Altı ability skoru ve modifierlar." },
    { id: "combat", title: "Combat", description: "HP, AC ve notlar." },
    { id: "spells", title: "Spells", description: "Known, prepared ve cantrip seçimi." },
    { id: "equipment", title: "Equipment", description: "Inventory, gold ve kuşanılan ekipman." },
    { id: "review", title: "Review", description: "Son kontrol ve kayıt." },
  ] as const;

  const activeStep = builderSteps[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === builderSteps.length - 1;

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

  const knownSpells = useMemo(() => {
    const spellMap = new Map((rulesetData?.spells ?? []).map((spell) => [spell.id, spell]));
    return draft.knownSpellIds
      .map((spellId) => spellMap.get(spellId) ?? null)
      .filter((spell): spell is DndSpellData => Boolean(spell));
  }, [rulesetData, draft.knownSpellIds]);

  const preparedSpells = useMemo(() => {
    const preparedSet = new Set(draft.preparedSpellIds);
    return knownSpells.filter((spell) => spell.level === 0 || preparedSet.has(spell.id));
  }, [knownSpells, draft.preparedSpellIds]);

  const selectedInventoryItems = useMemo(() => {
    return getCharacterInventoryItems(draft.inventory, rulesetData?.items);
  }, [draft.inventory, rulesetData]);

  const inventoryWeight = useMemo(() => {
    return getInventoryWeight(draft.inventory, rulesetData?.items);
  }, [draft.inventory, rulesetData]);

  const effectiveArmorClass = calculateEffectiveArmorClass(draft, rulesetData?.items);
  const suggestedArmorClass = calculateSuggestedArmorClass(draft, rulesetData?.items);

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

  function applyStandardArray() {
    setDraft((current) => ({
      ...current,
      abilities: {
        str: 15,
        dex: 14,
        con: 13,
        int: 12,
        wis: 10,
        cha: 8,
      },
    }));
  }

  function goToStep(index: number) {
    setActiveStepIndex(Math.min(builderSteps.length - 1, Math.max(0, index)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    goToStep(activeStepIndex - 1);
  }

  function goNext() {
    if (activeStep.id === "basic" && !draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (activeStep.id === "class" && !draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      return;
    }

    goToStep(activeStepIndex + 1);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      goToStep(0);
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      goToStep(1);
      return;
    }

    onCreateCharacter({
      ...draft,
      armorClass: calculateEffectiveArmorClass(draft, rulesetData?.items),
    });
    clearDraft(emptyDraft);
    setActiveStepIndex(0);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft],
  );

  return (
    <PageShell
      eyebrow="Character Builder"
      title="Yeni Karakter"
      description="Builder artık adım adım ilerliyor. Tek sayfada karakter, spell, inventory ve varoluş krizi taşımıyoruz."
    >
      <div className="builder-v2-layout">
        <aside className="builder-stepper">
          {builderSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={index === activeStepIndex ? "active" : ""}
              onClick={() => goToStep(index)}
            >
              <strong>{index + 1}. {step.title}</strong>
              <span>{step.description}</span>
            </button>
          ))}
        </aside>

        <form className="builder-form builder-v2-form" onSubmit={handleSubmit}>
          <div className="builder-step-head">
            <span className="mini-label">Step {activeStepIndex + 1} / {builderSteps.length}</span>
            <h2>{activeStep.title}</h2>
            <p>{activeStep.description}</p>
          </div>
          <AutosaveStatus
            label="Karakter taslağı"
            lastSavedAt={lastSavedAt}
            restoredAt={restoredAt}
            onClear={() => {
              const confirmed = confirm("Karakter taslağı temizlensin mi?");
              if (confirmed) {
                clearDraft(emptyDraft);
                setActiveStepIndex(0);
              }
            }}
          />

          {activeStep.id === "basic" ? (
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
                    onChange={(event) => updateDraft("playerName", event.target.value)}
                    placeholder="Oyuncu adı"
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
              </div>
            </section>
          ) : null}

          {activeStep.id === "class" ? (
            <section className="form-panel">
              <h2>Race & Class</h2>

              <div className="form-grid">
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
                        {isRulesetLoading ? "Race data yükleniyor..." : "Race seç"}
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
                          ? "Class data yükleniyor..."
                          : "Class seç"}
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
                    onChange={(event) => updateDraft("subclass", event.target.value)}
                    placeholder="Desert Domain..."
                  />
                </label>

                <label>
                  Background
                  <input
                    value={draft.background}
                    onChange={(event) => updateDraft("background", event.target.value)}
                    placeholder="Acolyte, Sailor..."
                  />
                </label>
              </div>

              {rulesetError ? (
                <div className="empty-panel">
                  <h2>Ruleset data yüklenemedi</h2>
                  <p>{rulesetError}</p>
                </div>
              ) : null}

              {selectedRace || selectedClass ? (
                <div className="builder-choice-grid">
                  {selectedRace ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Race</span>
                      <h3>{selectedRace.name}</h3>
                      <p>{selectedRace.description}</p>
                      <div className="preview-stats">
                        <span>Speed {selectedRace.speed} ft</span>
                        <span>Size {selectedRace.size}</span>
                        <span>
                          Bonus {" "}
                          {Object.entries(selectedRace.abilityBonuses)
                            .map(
                              ([ability, bonus]) =>
                                `${ability.toUpperCase()} +${bonus}`,
                            )
                            .join(", ")}
                        </span>
                      </div>
                    </article>
                  ) : null}

                  {selectedClass ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Class</span>
                      <h3>{selectedClass.name}</h3>
                      <p>{selectedClass.description}</p>
                      <div className="preview-stats">
                        <span>Hit Die d{selectedClass.hitDie}</span>
                        <span>
                          Saves {" "}
                          {selectedClass.savingThrows
                            .map((save) => save.toUpperCase())
                            .join(", ")}
                        </span>
                        <span>
                          Spell {" "}
                          {selectedClass.spellcastingAbility
                            ? selectedClass.spellcastingAbility.toUpperCase()
                            : "None"}
                        </span>
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeStep.id === "abilities" ? (
            <section className="form-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Ability Scores</h2>
                  <p>Skorları gir, modifierlar otomatik hesaplanır. Matematik yine yazılıma kaldı, insanlık rahat.</p>
                </div>

                <button type="button" onClick={applyStandardArray}>
                  Standard Array
                </button>
              </div>

              <div className="ability-editor ability-editor-v2">
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
          ) : null}

          {activeStep.id === "combat" ? (
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
                  Manual Armor Class
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

              <div className="builder-summary-grid">
                <div>
                  <span>Effective AC</span>
                  <strong>{effectiveArmorClass}</strong>
                </div>
                <div>
                  <span>Suggested AC</span>
                  <strong>{suggestedArmorClass}</strong>
                </div>
                <div>
                  <span>Initiative</span>
                  <strong>{formatModifier(getInitiative(previewCharacter))}</strong>
                </div>
                <div>
                  <span>Spell DC</span>
                  <strong>{getSpellSaveDc(previewCharacter)}</strong>
                </div>
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
          ) : null}

          {activeStep.id === "spells" ? (
            <CharacterSpellSelector
              title="Karakter Spellbook"
              description="Bu karakterin bildiği cantripleri ve hazırladığı büyüleri seç. Slotlar karakter detayında takip ediliyor."
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
          ) : null}

          {activeStep.id === "equipment" ? (
            <CharacterInventoryManager
              title="Inventory & Equipment"
              description="Karakterin itemlarını, altınını ve kuşandığı ekipmanı seç. AC auto ise zırh ve shield hesaba katılır."
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
          ) : null}

          {activeStep.id === "review" ? (
            <section className="form-panel preview-panel builder-review-panel">
              <h2>Review & Save</h2>
              <p>Kaydetmeden önce son kontrol. Sonra “Ben bunu böyle mi yapmışım?” demek yine mümkün ama en azından app uyarmış olur.</p>

              <div className="builder-review-hero">
                <div>
                  <span className="mini-label">Character</span>
                  <h2>{draft.name || "İsimsiz Karakter"}</h2>
                  <p>
                    {draft.race || "Unknown Race"} • {draft.className || "Unknown Class"} • Level {draft.level}
                  </p>
                </div>
                <strong className="level-badge">AC {effectiveArmorClass}</strong>
              </div>

              <div className="builder-summary-grid">
                <div>
                  <span>Max HP</span>
                  <strong>{draft.maxHp}</strong>
                </div>
                <div>
                  <span>PB</span>
                  <strong>+{getProficiencyBonus(previewCharacter.level)}</strong>
                </div>
                <div>
                  <span>Initiative</span>
                  <strong>{formatModifier(getInitiative(previewCharacter))}</strong>
                </div>
                <div>
                  <span>Passive Perception</span>
                  <strong>{getPassivePerception(previewCharacter)}</strong>
                </div>
                <div>
                  <span>Known Spells</span>
                  <strong>{knownSpells.length}</strong>
                </div>
                <div>
                  <span>Prepared / Ready</span>
                  <strong>{preparedSpells.length}</strong>
                </div>
                <div>
                  <span>Inventory</span>
                  <strong>{selectedInventoryItems.length}</strong>
                </div>
                <div>
                  <span>Weight</span>
                  <strong>{inventoryWeight} lb</strong>
                </div>
                <div>
                  <span>Gold</span>
                  <strong>{draft.gold}</strong>
                </div>
              </div>

              <div className="preview-stats">
                {Object.entries(draft.abilities).map(([ability, score]) => (
                  <span key={ability}>
                    {ability.toUpperCase()} {score} ({formatModifier(getAbilityModifier(score))})
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="builder-navigation-bar">
            <button type="button" onClick={goPrevious} disabled={isFirstStep}>
              Geri
            </button>

            <div>
              <strong>{activeStep.title}</strong>
              <span>{activeStepIndex + 1} / {builderSteps.length}</span>
            </div>

            {isLastStep ? (
              <button className="primary-action" type="submit">
                Karakteri Kaydet
              </button>
            ) : (
              <button className="primary-action" type="button" onClick={goNext}>
                İleri
              </button>
            )}
          </div>
        </form>
      </div>
    </PageShell>
  );
}

