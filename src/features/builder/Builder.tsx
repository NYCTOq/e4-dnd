import { useMemo, useState } from "react";
import { AutosaveStatus } from "../../shared/forms/AutosaveStatus";
import { useAutosavedDraft } from "../../shared/state/useAutosavedDraft";
import type { RulesetData, DndSpellData } from "../../core/rulesets/ruleset.types";
import { applyAbilityBonuses, getOriginAbilityBonuses } from "../../core/rulesets/originRules";
import { getRulesetDefinition } from "../../core/rulesets/rulesetRegistry";
import { getSubclassesForClass, getUnlockedSubclassFeatures } from "../../core/rulesets/subclassRules";
import { getGeneralFeatSlotCount, getGrantedOriginFeatName, isFeatEligible } from "../../core/rulesets/featRules";
import { buildFinalSkillProficiencies, getAvailableClassSkills, getExpertiseLimit, getGrantedSkills, normalizeClassSkillChoices, normalizeExpertise, uniqueStrings } from "../../core/rulesets/proficiencyRules";
import { hasValidationErrors, validateCharacterDraft } from "../../core/rulesets/characterValidation";
import { getBuilderStepId, getBuilderStepIssueCounts, getFirstErrorStepIndex } from "../../core/rulesets/builderProgress";
import { getClassSpellSlots } from "../../core/rulesets/spellcastingRules";
import { useSelectedRuleset } from "../../core/rulesets/useSelectedRuleset";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import type { CharacterDraft } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { CharacterInventoryManager, CharacterSpellSelector, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getInventoryWeight, normalizeCharacterDraft } from "../characters/characterShared";

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
  const { settings } = useAppSettings();
  const initialDraft = useMemo(() => ({ ...emptyDraft, ruleset: settings.defaultRuleset }), [settings.defaultRuleset]);
  const {
    value: draft,
    setValue: setDraft,
    clearDraft,
    lastSavedAt,
    restoredAt,
  } = useAutosavedDraft<CharacterDraft>(
    "e4_dnd_draft_character_builder_v1",
    initialDraft,
    {
      normalize: (value) => normalizeCharacterDraft(value, initialDraft),
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
  const selectedRuleset = useSelectedRuleset(draft.ruleset, rulesetData);
  const activeRulesetData = selectedRuleset.data;
  const activeRulesetLoading = selectedRuleset.loading || (draft.ruleset === rulesetData?.id && isRulesetLoading);
  const activeRulesetError = selectedRuleset.error ?? (draft.ruleset === rulesetData?.id ? rulesetError : null);
  const rulesetDefinition = getRulesetDefinition(draft.ruleset);

  const builderSteps = [
    { id: "basic", title: "Basic", description: "İsim, oyuncu ve temel kimlik." },
    { id: "class", title: "Race & Class", description: "Tür, sınıf, seviye ve arka plan." },
    { id: "abilities", title: "Abilities", description: "Altı ability skoru ve modifierlar." },
    { id: "proficiencies", title: "Skills", description: "Skill, expertise, tool ve language seçimleri." },
    { id: "feats", title: "Feats", description: "Origin ve general feat seçimleri." },
    { id: "combat", title: "Combat", description: "HP, AC ve notlar." },
    { id: "spells", title: "Spells", description: "Known, prepared ve cantrip seçimi." },
    { id: "equipment", title: "Equipment", description: "Inventory, gold ve kuşanılan ekipman." },
    { id: "review", title: "Review", description: "Son kontrol ve kayıt." },
  ] as const;

  const activeStep = builderSteps[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === builderSteps.length - 1;

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

  const availableSubclasses = useMemo(() => getSubclassesForClass(activeRulesetData?.subclasses ?? [], draft.className), [activeRulesetData, draft.className]);
  const selectedSubclass = useMemo(() => availableSubclasses.find((item) => item.name === draft.subclass) ?? null, [availableSubclasses, draft.subclass]);
  const unlockedSubclassFeatures = useMemo(() => getUnlockedSubclassFeatures(selectedSubclass, draft.level), [selectedSubclass, draft.level]);

  const selectedSubrace = useMemo(() => selectedRace?.subraces?.find((item) => item.name === draft.subrace) ?? null, [selectedRace, draft.subrace]);
  const selectedBackground = useMemo(() => activeRulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null, [activeRulesetData, draft.background]);
  const originBonuses = useMemo(() => getOriginAbilityBonuses(draft.ruleset, selectedRace, selectedSubrace, selectedBackground, draft.originAbilityPrimary, draft.originAbilitySecondary), [draft.ruleset, draft.originAbilityPrimary, draft.originAbilitySecondary, selectedRace, selectedSubrace, selectedBackground]);
  const finalAbilities = useMemo(() => applyAbilityBonuses(draft.abilities, originBonuses), [draft.abilities, originBonuses]);
  const generalFeatSlots = useMemo(() => getGeneralFeatSlotCount(draft.level, draft.className, draft.ruleset), [draft.level, draft.className, draft.ruleset]);
  const grantedOriginFeatName = getGrantedOriginFeatName(draft.ruleset, selectedBackground?.originFeat);
  const selectableFeats = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => feat.category !== "origin"), [activeRulesetData]);
  const selectedFeats = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => draft.featIds.includes(feat.id)), [activeRulesetData, draft.featIds]);
  const canCastSpells = Boolean(selectedClass?.spellcastingAbility);
  const grantedSkills = useMemo(() => getGrantedSkills(selectedBackground), [selectedBackground]);
  const availableClassSkills = useMemo(() => getAvailableClassSkills(selectedClass, selectedBackground), [selectedClass, selectedBackground]);
  const normalizedClassSkills = useMemo(() => normalizeClassSkillChoices(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const finalSkillProficiencies = useMemo(() => buildFinalSkillProficiencies(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const expertiseLimit = getExpertiseLimit(draft.className, draft.level);
  const validationIssues = useMemo(() => validateCharacterDraft(draft, activeRulesetData, finalAbilities), [draft, activeRulesetData, finalAbilities]);
  const validationHasErrors = hasValidationErrors(validationIssues);
  const builderProgress = Math.round((activeStepIndex / (builderSteps.length - 1)) * 100);

  function goToValidationIssue(stepName: string) {
    const targetIndex = builderSteps.findIndex((step) => step.id === getBuilderStepId(stepName));
    goToStep(targetIndex < 0 ? builderSteps.length - 1 : targetIndex);
  }

  function goToFirstError() {
    const targetIndex = getFirstErrorStepIndex(builderSteps.map((step) => step.id), validationIssues);
    if (targetIndex >= 0) goToStep(targetIndex);
  }

  function toggleSkill(skill: string) {
    setDraft((current) => {
      const selected = normalizeClassSkillChoices(current.skillProficiencies, selectedClass, selectedBackground);
      if (selected.includes(skill)) return { ...current, skillProficiencies: selected.filter((item) => item !== skill), expertiseSkills: current.expertiseSkills.filter((item) => item !== skill) };
      if (selected.length >= (selectedClass?.skillChoices.choose ?? 0)) return current;
      return { ...current, skillProficiencies: [...selected, skill] };
    });
  }

  function toggleExpertise(skill: string) {
    setDraft((current) => {
      const selected = current.expertiseSkills.includes(skill)
        ? current.expertiseSkills.filter((item) => item !== skill)
        : [...current.expertiseSkills, skill];
      return { ...current, expertiseSkills: normalizeExpertise(selected, finalSkillProficiencies, expertiseLimit) };
    });
  }

  function toggleFeat(featId: string) {
    setDraft((current) => {
      if (current.featIds.includes(featId)) {
        return { ...current, featIds: current.featIds.filter((id) => id !== featId) };
      }
      if (current.featIds.length >= generalFeatSlots) return current;
      return { ...current, featIds: [...current.featIds, featId] };
    });
  }

  const knownSpells = useMemo(() => {
    const spellMap = new Map((activeRulesetData?.spells ?? []).map((spell) => [spell.id, spell]));
    return draft.knownSpellIds
      .map((spellId) => spellMap.get(spellId) ?? null)
      .filter((spell): spell is DndSpellData => Boolean(spell));
  }, [activeRulesetData, draft.knownSpellIds]);

  const preparedSpells = useMemo(() => {
    const preparedSet = new Set(draft.preparedSpellIds);
    return knownSpells.filter((spell) => spell.level === 0 || preparedSet.has(spell.id));
  }, [knownSpells, draft.preparedSpellIds]);

  const selectedInventoryItems = useMemo(() => {
    return getCharacterInventoryItems(draft.inventory, activeRulesetData?.items);
  }, [draft.inventory, activeRulesetData]);

  const inventoryWeight = useMemo(() => {
    return getInventoryWeight(draft.inventory, activeRulesetData?.items);
  }, [draft.inventory, activeRulesetData]);

  const effectiveArmorClass = calculateEffectiveArmorClass(draft, activeRulesetData?.items);
  const suggestedArmorClass = calculateSuggestedArmorClass(draft, activeRulesetData?.items);

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

    if (validationHasErrors) {
      setActiveStepIndex(builderSteps.length - 1);
      alert("Karakter kaydedilmeden önce Review ekranındaki zorunlu hataları düzeltmelisin.");
      return;
    }

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

    const validFeatIds = draft.featIds
      .filter((featId) => selectableFeats.some((feat) => feat.id === featId && isFeatEligible(feat, { level: draft.level, className: draft.className, abilities: finalAbilities, canCastSpells }).eligible))
      .slice(0, generalFeatSlots);

    onCreateCharacter({
      ...draft,
      featIds: validFeatIds,
      skillProficiencies: finalSkillProficiencies,
      expertiseSkills: normalizeExpertise(draft.expertiseSkills, finalSkillProficiencies, expertiseLimit),
      toolProficiencies: uniqueStrings([...(selectedBackground?.toolProficiencies ?? []), ...draft.toolProficiencies]),
      languages: uniqueStrings([...(selectedBackground?.languages ?? []), ...draft.languages]),
      spellSlots: getClassSpellSlots(selectedClass, draft.level),
      abilities: finalAbilities,
      armorClass: calculateEffectiveArmorClass({ ...draft, abilities: finalAbilities }, activeRulesetData?.items),
    });
    clearDraft(initialDraft);
    setActiveStepIndex(0);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft({ ...draft, abilities: finalAbilities }),
    [draft, finalAbilities],
  );

  return (
    <PageShell
      eyebrow="Character Builder"
      title="Yeni Karakter"
      description="Builder artık adım adım ilerliyor. Tek sayfada karakter, spell, inventory ve varoluş krizi taşımıyoruz."
    >
      <div className="builder-v2-layout">
        <aside className="builder-stepper">
          {builderSteps.map((step, index) => {
            const counts = getBuilderStepIssueCounts(step.id, validationIssues);
            const statusClass = counts.errors ? "has-error" : counts.warnings ? "has-warning" : index < activeStepIndex ? "is-complete" : "";
            const statusLabel = counts.errors ? `${counts.errors} hata` : counts.warnings ? `${counts.warnings} uyarı` : index < activeStepIndex ? "Tamam" : index === activeStepIndex ? "Şu an" : "Bekliyor";
            return (
            <button
              key={step.id}
              type="button"
              className={`${index === activeStepIndex ? "active" : ""} ${statusClass}`.trim()}
              onClick={() => goToStep(index)}
            >
              <strong>{index + 1}. {step.title}</strong>
              <span>{step.description}</span>
              <small className="builder-step-status">{statusLabel}</small>
            </button>
            );
          })}
        </aside>

        <form className="builder-form builder-v2-form" onSubmit={handleSubmit}>
          <div className="builder-step-head">
            <span className="mini-label">Step {activeStepIndex + 1} / {builderSteps.length}</span>
            <h2>{activeStep.title}</h2>
            <p>{activeStep.description}</p>
            <div className="builder-progress-strip" aria-label={`Karakter oluşturma ilerlemesi yüzde ${builderProgress}`}>
              <span style={{ width: `${builderProgress}%` }} />
            </div>
          </div>
          <AutosaveStatus
            label="Karakter taslağı"
            lastSavedAt={lastSavedAt}
            restoredAt={restoredAt}
            onClear={() => {
              const confirmed = confirm("Karakter taslağı temizlensin mi?");
              if (confirmed) {
                clearDraft(initialDraft);
                setActiveStepIndex(0);
              }
            }}
          />
          {restoredAt ? (
            <div className="draft-restored-banner" role="status">
              <strong>Taslak geri yüklendi</strong>
              <span>Yarım kalan karakterin kaldığı verilerle devam edebilirsin.</span>
            </div>
          ) : null}

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
                    onChange={(event) => {
                      const nextRuleset = event.target.value as CharacterDraft["ruleset"];
                      setDraft((current) => ({
                        ...current,
                        ruleset: nextRuleset,
                        race: "", subrace: "", className: "", subclass: "", background: "", originAbilityPrimary: undefined, originAbilitySecondary: undefined,
                        knownSpellIds: [], preparedSpellIds: [], spellSlots: [], featIds: [], skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [],
                        inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [],
                      }));
                    }}
                  >
                    <option value="dnd_2014">D&D 2014</option>
                    <option value="dnd_2024">D&D 2024</option>
                    <option value="homebrew">Homebrew</option>
                  </select>
                </label>
              </div>
              <div className="ruleset-foundation-card">
                <div><span className="mini-label">{rulesetDefinition.editionLabel}</span><strong>{rulesetDefinition.name}</strong></div>
                <span className={`ruleset-status ${rulesetDefinition.readiness}`}>{rulesetDefinition.readiness === "ready" ? "Veri hazır" : rulesetDefinition.readiness === "foundation" ? "Altyapı hazır, veri genişletiliyor" : "Manuel içerik"}</span>
                <ul>{rulesetDefinition.notes.map((note) => <li key={note}>{note}</li>)}</ul>
              </div>
            </section>
          ) : null}

          {activeStep.id === "class" ? (
            <section className="form-panel">
              <h2>{rulesetDefinition.raceTerm}, Background & Class</h2>

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
                  {rulesetDefinition.raceTerm}
                  {draft.ruleset !== "homebrew" ? (
                    <select
                      value={draft.race}
                      disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                      onChange={(event) => setDraft((current) => ({ ...current, race: event.target.value, subrace: "" }))}
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

                {selectedRace?.subraces?.length ? (
                  <label>
                    Subrace
                    <select value={draft.subrace ?? ""} onChange={(event) => updateDraft("subrace", event.target.value)}>
                      <option value="">Subrace seç</option>
                      {selectedRace.subraces.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </label>
                ) : null}

                <label>
                  Class
                  {draft.ruleset !== "homebrew" ? (
                    <select
                      value={draft.className}
                      disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, className: event.target.value, subclass: "", skillProficiencies: [], expertiseSkills: [] }))
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
                  {draft.ruleset !== "homebrew" ? (
                    <select value={draft.subclass} disabled={!draft.className || draft.level < (selectedClass?.subclassLevel ?? 1)} onChange={(event) => updateDraft("subclass", event.target.value)}>
                      <option value="">{!draft.className ? "Önce class seç" : draft.level < (selectedClass?.subclassLevel ?? 1) ? `Level ${selectedClass?.subclassLevel} gerekli` : "Subclass seç"}</option>
                      {availableSubclasses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  ) : (
                    <input value={draft.subclass} onChange={(event) => updateDraft("subclass", event.target.value)} placeholder="Desert Domain..." />
                  )}
                </label>

                <label>
                  Background
                  {draft.ruleset !== "homebrew" ? (
                    <select value={draft.background} disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData} onChange={(event) => setDraft((current) => ({ ...current, background: event.target.value, originAbilityPrimary: undefined, originAbilitySecondary: undefined, skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [] }))}>
                      <option value="">Background seç</option>
                      {activeRulesetData?.backgrounds.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  ) : (
                    <input value={draft.background} onChange={(event) => updateDraft("background", event.target.value)} placeholder="Custom background..." />
                  )}
                </label>

                {draft.ruleset === "dnd_2024" && selectedBackground ? (
                  <>
                    <label>+2 Ability
                      <select value={draft.originAbilityPrimary ?? ""} onChange={(event) => updateDraft("originAbilityPrimary", event.target.value as CharacterDraft["originAbilityPrimary"])}>
                        <option value="">Seç</option>
                        {selectedBackground.abilityOptions?.map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}
                      </select>
                    </label>
                    <label>+1 Ability
                      <select value={draft.originAbilitySecondary ?? ""} onChange={(event) => updateDraft("originAbilitySecondary", event.target.value as CharacterDraft["originAbilitySecondary"])}>
                        <option value="">Seç</option>
                        {selectedBackground.abilityOptions?.filter((ability) => ability !== draft.originAbilityPrimary).map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}
                      </select>
                    </label>
                  </>
                ) : null}
              </div>

              {activeRulesetError ? (
                <div className="empty-panel">
                  <h2>Ruleset data yüklenemedi</h2>
                  <p>{activeRulesetError}</p>
                </div>
              ) : null}

              {selectedRace || selectedClass ? (
                <div className="builder-choice-grid">
                  {selectedRace ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">{rulesetDefinition.raceTerm}</span>
                      <h3>{selectedRace.name}{selectedSubrace ? ` · ${selectedSubrace.name}` : ""}</h3>
                      <p>{selectedRace.description}</p>
                      <div className="preview-stats">
                        <span>Speed {selectedRace.speed} ft</span>
                        <span>Size {selectedRace.size}</span>
                        <span>
                          Ability Bonus {" "}
                          {Object.entries(originBonuses).length ? Object.entries(originBonuses).map(([ability, bonus]) => `${ability.toUpperCase()} +${bonus}`).join(", ") : draft.ruleset === "dnd_2024" ? "Background seçimine bağlı" : "Yok"}
                        </span>
                      </div>
                    </article>
                  ) : null}

                  {selectedBackground ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Background</span>
                      <h3>{selectedBackground.name}</h3>
                      <p>{selectedBackground.description}</p>
                      <div className="preview-stats">
                        <span>Skills {selectedBackground.skillProficiencies.join(", ")}</span>
                        {selectedBackground.feature ? <span>Feature {selectedBackground.feature}</span> : null}
                        {selectedBackground.originFeat ? <span>Origin Feat {selectedBackground.originFeat}</span> : null}
                      </div>
                    </article>
                  ) : null}

                  {selectedClass ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Class · {rulesetDefinition.shortName}</span>
                      <h3>{selectedClass.name}</h3>
                      <p>{selectedClass.description}</p>
                      <div className="preview-stats">
                        <span>Hit Die d{selectedClass.hitDie}</span>
                        <span>Subclass L{selectedClass.subclassLevel}</span>
                        <span>{selectedClass.spellProgression} progression</span>
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
                  {selectedSubclass ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Subclass · Level {selectedSubclass.selectionLevel}</span>
                      <h3>{selectedSubclass.name}</h3>
                      <p>{selectedSubclass.description}</p>
                      <div className="preview-stats">
                        {selectedSubclass.resourceName ? <span>Resource {selectedSubclass.resourceName}</span> : null}
                        {selectedSubclass.extraProficiencies?.map((item) => <span key={item}>Proficiency {item}</span>)}
                        {selectedSubclass.bonusSpells?.length ? <span>Bonus Spells {selectedSubclass.bonusSpells.join(", ")}</span> : null}
                        {unlockedSubclassFeatures.length ? unlockedSubclassFeatures.map((feature) => <span key={`${feature.level}-${feature.name}`}>L{feature.level} {feature.name}</span>) : <span>İlk özellik Level {selectedSubclass.selectionLevel} seviyesinde açılır.</span>}
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
                      max={20}
                      value={score}
                      onChange={(event) =>
                        updateAbility(
                          ability as keyof CharacterDraft["abilities"],
                          Number(event.target.value),
                        )
                      }
                    />

                    <strong>{formatModifier(getAbilityModifier(finalAbilities[ability as keyof CharacterDraft["abilities"]]))}</strong>
                    {originBonuses[ability as keyof CharacterDraft["abilities"]] ? <small>{score} + {originBonuses[ability as keyof CharacterDraft["abilities"]]} = {finalAbilities[ability as keyof CharacterDraft["abilities"]]}</small> : null}
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {activeStep.id === "proficiencies" ? (
            <section className="form-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Skills & Proficiencies</h2>
                  <p>Background skillleri otomatik gelir; class seçimleri duplicate olmadan kotaya göre eklenir.</p>
                </div>
                <span className="mini-label">{normalizedClassSkills.length} / {selectedClass?.skillChoices.choose ?? 0} class skill</span>
              </div>

              {!selectedClass ? (
                <div className="empty-panel"><h2>Önce class seç</h2><p>Skill havuzu ve seçim kotası class verisinden gelir.</p></div>
              ) : (
                <>
                  {grantedSkills.length ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Background tarafından verildi</span>
                      <h3>{grantedSkills.join(", ")}</h3>
                      <p>Bu skilller otomatik proficient kabul edilir ve class kotasını harcamaz.</p>
                    </article>
                  ) : null}

                  <div className="builder-choice-grid">
                    {availableClassSkills.map((skill) => {
                      const selected = normalizedClassSkills.includes(skill);
                      const full = !selected && normalizedClassSkills.length >= (selectedClass.skillChoices.choose ?? 0);
                      return (
                        <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={skill}>
                          <div className="panel-heading-row"><h3>{skill}</h3><button type="button" disabled={full} onClick={() => toggleSkill(skill)}>{selected ? "Kaldır" : "Seç"}</button></div>
                        </article>
                      );
                    })}
                  </div>

                  {expertiseLimit > 0 ? (
                    <div className="form-panel nested-panel">
                      <div className="panel-heading-row"><div><h3>Expertise</h3><p>Yalnızca proficient olduğun skilllerden seçebilirsin.</p></div><span className="mini-label">{draft.expertiseSkills.length} / {expertiseLimit}</span></div>
                      <div className="builder-choice-grid">
                        {finalSkillProficiencies.map((skill) => {
                          const selected = draft.expertiseSkills.includes(skill);
                          return <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={skill}><div className="panel-heading-row"><h3>{skill}</h3><button type="button" disabled={!selected && draft.expertiseSkills.length >= expertiseLimit} onClick={() => toggleExpertise(skill)}>{selected ? "Kaldır" : "Expertise"}</button></div></article>;
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="form-grid">
                    <label>Tool Proficiencies
                      <input value={draft.toolProficiencies.join(", ")} onChange={(event) => updateDraft("toolProficiencies", uniqueStrings(event.target.value.split(",")))} placeholder="Thieves' Tools, Navigator's Tools..." />
                    </label>
                    <label>Languages
                      <input value={draft.languages.join(", ")} onChange={(event) => updateDraft("languages", uniqueStrings(event.target.value.split(",")))} placeholder="Common, Elvish, Draconic..." />
                    </label>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeStep.id === "feats" ? (
            <section className="form-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Feats</h2>
                  <p>Uygun olmayan featler kilitli görünür. Kurallar sonunda dekor olmaktan çıktı.</p>
                </div>
                <span className="mini-label">{draft.featIds.length} / {generalFeatSlots} general feat</span>
              </div>

              {grantedOriginFeatName ? (
                <article className="builder-choice-card">
                  <span className="mini-label">Background tarafından verildi</span>
                  <h3>{grantedOriginFeatName}</h3>
                  <p>Bu Origin Feat seçili 2024 background paketinden otomatik gelir ve general feat kotasını kullanmaz.</p>
                </article>
              ) : null}

              {!generalFeatSlots ? (
                <div className="empty-panel">
                  <h2>Henüz general feat hakkı yok</h2>
                  <p>Class ve level seçimine göre ilk feat hakkı açıldığında seçenekler burada etkinleşecek.</p>
                </div>
              ) : null}

              <div className="builder-choice-grid">
                {selectableFeats.map((feat) => {
                  const eligibility = isFeatEligible(feat, {
                    level: draft.level,
                    className: draft.className,
                    abilities: finalAbilities,
                    canCastSpells,
                  });
                  const selected = draft.featIds.includes(feat.id);
                  const slotFull = !selected && draft.featIds.length >= generalFeatSlots;
                  const disabled = !eligibility.eligible || slotFull;

                  return (
                    <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={feat.id}>
                      <div className="panel-heading-row">
                        <div>
                          <span className="mini-label">{feat.category === "epic-boon" ? "Epic Boon" : "General Feat"}</span>
                          <h3>{feat.name}</h3>
                        </div>
                        <button type="button" disabled={disabled} onClick={() => toggleFeat(feat.id)}>
                          {selected ? "Kaldır" : "Seç"}
                        </button>
                      </div>
                      <p>{feat.summary}</p>
                      <div className="preview-stats">
                        {feat.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
                        {!eligibility.eligible ? <span>Kilitli: {eligibility.reasons.join(" · ")}</span> : null}
                        {slotFull ? <span>Feat kotası dolu</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              {selectedFeats.length ? (
                <div className="ruleset-foundation-card">
                  <strong>Seçilen featler</strong>
                  <span>{selectedFeats.map((feat) => feat.name).join(", ")}</span>
                </div>
              ) : null}
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
              characterLevel={draft.level}
              abilities={finalAbilities}
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

              <div className={`ruleset-foundation-card ${validationHasErrors ? "validation-error" : "validation-success"}`}>
                <div className="panel-heading-row">
                  <div>
                    <span className="mini-label">Character Validation</span>
                    <strong>{validationHasErrors ? "Kaydetmeden önce düzeltme gerekli" : "Zorunlu kontroller tamam"}</strong>
                  </div>
                  <span>{validationIssues.filter((issue) => issue.severity === "error").length} hata · {validationIssues.filter((issue) => issue.severity === "warning").length} uyarı</span>
                </div>
                {validationIssues.length ? (
                  <>
                    {validationHasErrors ? <button className="validation-first-error" type="button" onClick={goToFirstError}>İlk hataya git</button> : null}
                    <ul className="validation-issue-list">{validationIssues.map((issue) => <li key={issue.id}><button type="button" onClick={() => goToValidationIssue(issue.step)}><strong>{issue.severity === "error" ? "Hata" : "Uyarı"} · {issue.step}:</strong> {issue.message}<span>Düzelt →</span></button></li>)}</ul>
                  </>
                ) : <p>Karakter kurallı biçimde kaydedilmeye hazır.</p>}
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
                <div>
                  <span>Ruleset</span>
                  <strong>{rulesetDefinition.editionLabel}</strong>
                </div>
                <div>
                  <span>Subclass</span>
                  <strong>{draft.subclass || "—"}</strong>
                </div>
                <div>
                  <span>Skills / Expertise</span>
                  <strong>{finalSkillProficiencies.length} / {draft.expertiseSkills.length}</strong>
                </div>
                <div>
                  <span>Feats</span>
                  <strong>{selectedFeats.length}</strong>
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
              <button className="primary-action" type="submit" disabled={validationHasErrors} title={validationHasErrors ? "Review hatalarını düzelt" : "Karakteri kaydet"}>
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
