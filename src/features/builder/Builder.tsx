import { useMemo, useState } from "react";
import { AutosaveStatus } from "../../shared/forms/AutosaveStatus";
import { useAutosavedDraft } from "../../shared/state/useAutosavedDraft";
import type { RulesetData, DndSpellData } from "../../core/rulesets/ruleset.types";
import { getOriginAbilityBonuses } from "../../core/rulesets/originRules";
import { ABILITY_KEYS, STANDARD_ARRAY_VALUES, applyAbilityLayers, getAsiBudget, getFeatSelectionAsiError, getHighLevelAbilityError, getPointBuyRemaining, getSpentAsi, updateAbilityIncrease } from "../../core/rulesets/highLevelAbilityBuilder";
import { getRulesetDefinition } from "../../core/rulesets/rulesetRegistry";
import { getAlwaysPreparedSpells, getSubclassesForClass, getUnlockedSubclassFeatures } from "../../core/rulesets/subclassRules";
import { getFeatAbilityBonuses, getGeneralFeatSlotCount, getGrantedOriginFeatName, isFeatEligible } from "../../core/rulesets/featRules";
import { buildFinalSkillProficiencies, getAvailableClassSkills, getExpertiseLimit, getGrantedSkills, normalizeClassSkillChoices, normalizeExpertise, uniqueStrings } from "../../core/rulesets/proficiencyRules";
import { hasValidationErrors, validateCharacterDraft } from "../../core/rulesets/characterValidation";
import { getBuilderStepId, getBuilderStepIssueCounts, getFirstErrorStepIndex } from "../../core/rulesets/builderProgress";
import { normalizeDraftForProgression } from "../../core/rulesets/progressionDraftNormalization";
import { getClassSpellSlots } from "../../core/rulesets/spellcastingRules";
import { getHighestSpellLevel } from "../../core/rulesets/spellRules";
import { getAbilityBudgetError, getStandardArrayAbilities, type AbilityGenerationMethod } from "../../core/rulesets/abilityGenerationRules";
import { getFightingStyleChoiceCount, getFightingStyles } from "../../core/rulesets/fightingStyleRules";
import { getWeaponMastery, getWeaponMasteryChoiceCount } from "../../core/rulesets/equipmentRules";
import { getMetamagicChoiceCount, getMetamagicOptions } from "../../core/rulesets/metamagicRules";
import { getEldritchInvocations, getInvocationChoiceCount, isInvocationEligible } from "../../core/rulesets/invocationRules";
import { getWildShapeForms, getWildShapeKnownCount, isWildShapeFormEligible } from "../../core/rulesets/wildShapeRules";
import { getBattleMasterManeuvers, getManeuverChoiceCount, getSuperiorityDie } from "../../core/rulesets/maneuverRules";
import { getCompanionChoiceCount, getCompanionStats, getRangerCompanions } from "../../core/rulesets/companionRules";
import { getMysticArcanumLevels } from "../../core/rulesets/pactMagicRules";
import { useSelectedRuleset } from "../../core/rulesets/useSelectedRuleset";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import type { CharacterDraft } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getInitiative, getPassivePerception, getProficiencyBonus, getSpellSaveDc } from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { NumberStepper } from "../../shared/forms/NumberStepper";
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
  const [abilityMethod, setAbilityMethod] = useState<AbilityGenerationMethod>("standard-array");
  const [featSelectionNotice, setFeatSelectionNotice] = useState("");
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
  const alwaysPreparedSpells = useMemo(() => getAlwaysPreparedSpells(selectedSubclass, getHighestSpellLevel(selectedClass ?? undefined, draft.level), activeRulesetData?.spells ?? []), [selectedSubclass, selectedClass, draft.level, activeRulesetData]);
  const unlockedSubclassFeatures = useMemo(() => getUnlockedSubclassFeatures(selectedSubclass, draft.level), [selectedSubclass, draft.level]);

  const selectedSubrace = useMemo(() => selectedRace?.subraces?.find((item) => item.name === draft.subrace) ?? null, [selectedRace, draft.subrace]);
  const selectedBackground = useMemo(() => activeRulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null, [activeRulesetData, draft.background]);
  const originBonuses = useMemo(() => getOriginAbilityBonuses(
    draft.ruleset,
    selectedRace,
    selectedSubrace,
    selectedBackground,
    draft.originAbilityPrimary,
    draft.originAbilitySecondary,
    draft.originAbilityTertiary,
    draft.originAbilityMode ?? "2-1",
    draft.flexibleRaceAbilityPrimary,
    draft.flexibleRaceAbilitySecondary,
  ), [draft.ruleset, draft.originAbilityPrimary, draft.originAbilitySecondary, draft.originAbilityTertiary, draft.originAbilityMode, draft.flexibleRaceAbilityPrimary, draft.flexibleRaceAbilitySecondary, selectedRace, selectedSubrace, selectedBackground]);
  const asiBudget = getAsiBudget(draft.level, draft.className, draft.ruleset, draft.featIds.length);
  const preFeatAbilities = useMemo(() => applyAbilityLayers(draft.abilities, originBonuses, draft.abilityScoreIncreases), [draft.abilities, originBonuses, draft.abilityScoreIncreases]);
  const selectedFeatData = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => draft.featIds.includes(feat.id)), [activeRulesetData, draft.featIds]);
  const featAbilityBonuses = useMemo(() => getFeatAbilityBonuses(selectedFeatData, draft.featChoices), [selectedFeatData, draft.featChoices]);
  const finalAbilities = useMemo(() => applyAbilityLayers(preFeatAbilities, featAbilityBonuses, {}), [preFeatAbilities, featAbilityBonuses]);
  const generalFeatSlots = useMemo(() => getGeneralFeatSlotCount(draft.level, draft.className, draft.ruleset), [draft.level, draft.className, draft.ruleset]);
  const grantedOriginFeatName = getGrantedOriginFeatName(draft.ruleset, selectedBackground?.originFeat);
  const selectableFeats = useMemo(() => (activeRulesetData?.feats ?? []).filter((feat) => feat.id !== "ability-score-improvement" && feat.category !== "fighting-style" && feat.name !== grantedOriginFeatName), [activeRulesetData, grantedOriginFeatName]);
  const selectedFeats = selectedFeatData;
  const fightingStyles = useMemo(() => getFightingStyles(draft.ruleset), [draft.ruleset]);
  const fightingStyleLimit = getFightingStyleChoiceCount(draft.className, draft.level, draft.subclass);
  const selectedFightingStyleIds = draft.fightingStyleIds ?? [];
  const masteryLimit = getWeaponMasteryChoiceCount(selectedClass, draft.level, draft.ruleset);
  const masteryWeapons = useMemo(() => (activeRulesetData?.items ?? []).filter((item) => item.category === "weapon" && getWeaponMastery(item, draft.ruleset)), [activeRulesetData, draft.ruleset]);
  const masteredWeaponIds = draft.masteredWeaponIds ?? [];
  const metamagicOptions = useMemo(() => getMetamagicOptions(draft.ruleset), [draft.ruleset]);
  const metamagicLimit = getMetamagicChoiceCount(draft.className, draft.level, draft.ruleset);
  const selectedMetamagicIds = draft.metamagicIds ?? [];
  const invocationOptions = useMemo(() => getEldritchInvocations(draft.ruleset), [draft.ruleset]);
  const invocationLimit = getInvocationChoiceCount(draft.className, draft.level, draft.ruleset);
  const selectedInvocationIds = draft.invocationIds ?? [];
  const wildShapeLimit = getWildShapeKnownCount(draft.className,draft.level,draft.ruleset);
  const wildShapeForms = useMemo(()=>getWildShapeForms(),[]);
  const selectedWildShapeFormIds = draft.wildShapeFormIds ?? [];
  const maneuverOptions=useMemo(()=>getBattleMasterManeuvers(),[]);
  const maneuverLimit=getManeuverChoiceCount(draft.className,draft.subclass,draft.level,draft.ruleset);
  const selectedManeuverIds=draft.maneuverIds??[];
  const companionLimit=getCompanionChoiceCount(draft.className,draft.subclass,draft.level);
  const companionOptions=useMemo(()=>getRangerCompanions(draft.ruleset),[draft.ruleset]);
  const arcanumLevels=getMysticArcanumLevels(draft.className,draft.level,draft.ruleset);
  const arcanumOptions=useMemo(()=>(activeRulesetData?.spells??[]).filter(spell=>arcanumLevels.includes(spell.level)&&spell.classes.some(name=>name.toLowerCase()==="warlock")),[activeRulesetData,arcanumLevels]);
  const canCastSpells = Boolean(selectedClass?.spellcastingAbility);
  const grantedSkills = useMemo(() => getGrantedSkills(selectedBackground), [selectedBackground]);
  const availableClassSkills = useMemo(() => getAvailableClassSkills(selectedClass, selectedBackground), [selectedClass, selectedBackground]);
  const normalizedClassSkills = useMemo(() => normalizeClassSkillChoices(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const finalSkillProficiencies = useMemo(() => buildFinalSkillProficiencies(draft.skillProficiencies, selectedClass, selectedBackground), [draft.skillProficiencies, selectedClass, selectedBackground]);
  const expertiseLimit = getExpertiseLimit(draft.className, draft.level, draft.ruleset);
  const baseAbilityBudgetError = getAbilityBudgetError(abilityMethod, draft.abilities, 0);
  const highLevelAbilityError = getHighLevelAbilityError(draft, asiBudget);
  const abilityBudgetError = baseAbilityBudgetError ?? highLevelAbilityError;
  const validationIssues = useMemo(() => {
    const issues = validateCharacterDraft(draft, activeRulesetData, finalAbilities);
    if (abilityBudgetError) issues.push({ id: "ability-budget", severity: "error", step: "Abilities", message: abilityBudgetError });
    return issues;
  }, [draft, activeRulesetData, finalAbilities, abilityBudgetError]);
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
    const selected = draft.featIds.includes(featId);
    if (!selected) {
      const conflict = getFeatSelectionAsiError(draft, draft.featIds.length + 1);
      if (conflict) {
        setFeatSelectionNotice(conflict);
        return;
      }
    }
    setFeatSelectionNotice("");
    setDraft((current) => {
      if (current.featIds.includes(featId)) {
        const featChoices = { ...(current.featChoices ?? {}) }; delete featChoices[featId];
        return { ...current, featIds: current.featIds.filter((id) => id !== featId), featChoices };
      }
      if (current.featIds.length >= generalFeatSlots) return current;
      return { ...current, featIds: [...current.featIds, featId] };
    });
  }

  function toggleFightingStyle(styleId: string) {
    setDraft((current) => {
      const selected = current.fightingStyleIds ?? [];
      if (selected.includes(styleId)) return { ...current, fightingStyleIds: selected.filter((id) => id !== styleId) };
      if (selected.length >= fightingStyleLimit) return current;
      return { ...current, fightingStyleIds: [...selected, styleId] };
    });
  }

  function toggleWeaponMastery(weaponId: string) {
    setDraft((current) => {
      const selected = current.masteredWeaponIds ?? [];
      if (selected.includes(weaponId)) return { ...current, masteredWeaponIds: selected.filter((id) => id !== weaponId) };
      if (selected.length >= masteryLimit) return current;
      return { ...current, masteredWeaponIds: [...selected, weaponId] };
    });
  }
  function toggleMetamagic(id: string) { setDraft((current) => { const selected=current.metamagicIds??[]; if(selected.includes(id))return{...current,metamagicIds:selected.filter(item=>item!==id)}; if(selected.length>=metamagicLimit)return current; return{...current,metamagicIds:[...selected,id]}; }); }
  function toggleInvocation(id: string) { setDraft((current) => { const selected=current.invocationIds??[]; if(selected.includes(id))return{...current,invocationIds:selected.filter(item=>item!==id)}; const option=invocationOptions.find(item=>item.id===id); if(!option||!isInvocationEligible(option,current)||selected.length>=invocationLimit)return current; return{...current,invocationIds:[...selected,id]}; }); }
  function toggleWildShapeForm(id:string){setDraft(current=>{const selected=current.wildShapeFormIds??[];if(selected.includes(id))return{...current,wildShapeFormIds:selected.filter(item=>item!==id)};const form=wildShapeForms.find(item=>item.id===id);if(!form||!isWildShapeFormEligible(form,current.level,current.ruleset,current.subclass)||selected.length>=wildShapeLimit)return current;return{...current,wildShapeFormIds:[...selected,id]}})}
  function toggleManeuver(id:string){setDraft(current=>{const selected=current.maneuverIds??[];if(selected.includes(id))return{...current,maneuverIds:selected.filter(item=>item!==id)};if(!maneuverOptions.some(item=>item.id===id)||selected.length>=maneuverLimit)return current;return{...current,maneuverIds:[...selected,id]}})}
  function selectCompanion(id:string){setDraft(current=>({...current,companionId:current.companionId===id?undefined:id,companionCurrentHp:undefined}))}
  function selectArcanum(id:string,level:number){setDraft(current=>{const ids=current.arcanumSpellIds??[];const sameLevelIds=new Set(arcanumOptions.filter(spell=>spell.level===level).map(spell=>spell.id));return{...current,arcanumSpellIds:ids.includes(id)?ids.filter(item=>item!==id):[...ids.filter(item=>!sameLevelIds.has(item)),id],usedArcanumSpellIds:[]}})}

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
    setAbilityMethod("standard-array");
    setDraft((current) => ({ ...current, abilities: getStandardArrayAbilities() }));
  }

  function assignStandardArray(ability: keyof CharacterDraft["abilities"], value: number) {
    setDraft((current) => {
      const abilities = { ...current.abilities };
      const previous = abilities[ability];
      const occupied = ABILITY_KEYS.find((key) => key !== ability && abilities[key] === value);
      abilities[ability] = value;
      if (occupied) abilities[occupied] = previous;
      return { ...current, abilities };
    });
  }

  function adjustPointBuy(ability: keyof CharacterDraft["abilities"], delta: number) {
    setDraft((current) => {
      const currentValue = current.abilities[ability];
      const nextValue = Math.max(8, Math.min(15, currentValue + delta));
      const next = { ...current.abilities, [ability]: nextValue };
      if (getPointBuyRemaining(next) < 0) return current;
      return { ...current, abilities: next };
    });
  }

  function adjustAsi(ability: keyof CharacterDraft["abilities"], delta: number) {
    setDraft((current) => ({ ...current, abilityScoreIncreases: updateAbilityIncrease(current.abilityScoreIncreases, ability, delta, asiBudget) }));
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
      .filter((featId) => selectableFeats.some((feat) => feat.id === featId && isFeatEligible(feat, { level: draft.level, className: draft.className, abilities: preFeatAbilities, canCastSpells, armorTraining: selectedClass?.armorProficiencies, hasFightingStyleFeature: fightingStyleLimit > 0 }).eligible))
      .slice(0, generalFeatSlots);

    onCreateCharacter({
      ...draft,
      featIds: validFeatIds,
      skillProficiencies: finalSkillProficiencies,
      expertiseSkills: normalizeExpertise(draft.expertiseSkills, finalSkillProficiencies, expertiseLimit),
      toolProficiencies: uniqueStrings([...(selectedBackground?.toolProficiencies ?? []), ...draft.toolProficiencies]),
      languages: uniqueStrings([...(selectedBackground?.languages ?? []), ...draft.languages]),
      knownSpellIds: [...new Set([...draft.knownSpellIds, ...alwaysPreparedSpells.map((spell) => spell.id)])],
      preparedSpellIds: [...new Set([...draft.preparedSpellIds, ...alwaysPreparedSpells.map((spell) => spell.id)])],
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
                    onChange={(event) => {
                      const level = Number(event.target.value);
                      setDraft((current) => normalizeDraftForProgression({ ...current, level }, activeRulesetData));
                    }}
                  />
                </label>

                <label>
                  {rulesetDefinition.raceTerm}
                  {draft.ruleset !== "homebrew" ? (
                    <select
                      value={draft.race}
                      disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData}
                      onChange={(event) => setDraft((current) => ({ ...current, race: event.target.value, subrace: "", flexibleRaceAbilityPrimary: undefined, flexibleRaceAbilitySecondary: undefined }))}
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
                    <select value={draft.background} disabled={activeRulesetLoading || !!activeRulesetError || !activeRulesetData} onChange={(event) => setDraft((current) => ({ ...current, background: event.target.value, originAbilityPrimary: undefined, originAbilitySecondary: undefined, originAbilityTertiary: undefined, originAbilityMode: "2-1", skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [] }))}>
                      <option value="">Background seç</option>
                      {activeRulesetData?.backgrounds.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  ) : (
                    <input value={draft.background} onChange={(event) => updateDraft("background", event.target.value)} placeholder="Custom background..." />
                  )}
                </label>

                {draft.ruleset === "dnd_2024" && selectedBackground ? (
                  <>
                    <label>Background Ability Dağılımı
                      <select value={draft.originAbilityMode ?? "2-1"} onChange={(event) => setDraft((current) => ({ ...current, originAbilityMode: event.target.value as "2-1" | "1-1-1", originAbilityPrimary: undefined, originAbilitySecondary: undefined, originAbilityTertiary: undefined }))}>
                        <option value="2-1">+2 / +1</option>
                        <option value="1-1-1">+1 / +1 / +1</option>
                      </select>
                    </label>
                    <label>{draft.originAbilityMode === "1-1-1" ? "İlk +1" : "+2 Ability"}
                      <select value={draft.originAbilityPrimary ?? ""} onChange={(event) => updateDraft("originAbilityPrimary", event.target.value as CharacterDraft["originAbilityPrimary"])}>
                        <option value="">Seç</option>
                        {selectedBackground.abilityOptions?.map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}
                      </select>
                    </label>
                    <label>{draft.originAbilityMode === "1-1-1" ? "İkinci +1" : "+1 Ability"}
                      <select value={draft.originAbilitySecondary ?? ""} onChange={(event) => updateDraft("originAbilitySecondary", event.target.value as CharacterDraft["originAbilitySecondary"])}>
                        <option value="">Seç</option>
                        {selectedBackground.abilityOptions?.filter((ability) => ability !== draft.originAbilityPrimary).map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}
                      </select>
                    </label>
                    {draft.originAbilityMode === "1-1-1" ? <label>Üçüncü +1
                      <select value={draft.originAbilityTertiary ?? ""} onChange={(event) => updateDraft("originAbilityTertiary", event.target.value as CharacterDraft["originAbilityTertiary"])}>
                        <option value="">Seç</option>
                        {selectedBackground.abilityOptions?.filter((ability) => ability !== draft.originAbilityPrimary && ability !== draft.originAbilitySecondary).map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}
                      </select>
                    </label> : null}
                  </>
                ) : null}
                {draft.ruleset === "dnd_2014" && selectedRace?.name === "Half-Elf" ? <>
                  <label>Half-Elf Esnek +1
                    <select value={draft.flexibleRaceAbilityPrimary ?? ""} onChange={(event) => updateDraft("flexibleRaceAbilityPrimary", event.target.value as CharacterDraft["flexibleRaceAbilityPrimary"])}>
                      <option value="">Seç</option>{ABILITY_KEYS.filter((key) => key !== "cha").map((key) => <option key={key} value={key}>{key.toUpperCase()}</option>)}
                    </select>
                  </label>
                  <label>Half-Elf İkinci +1
                    <select value={draft.flexibleRaceAbilitySecondary ?? ""} onChange={(event) => updateDraft("flexibleRaceAbilitySecondary", event.target.value as CharacterDraft["flexibleRaceAbilitySecondary"])}>
                      <option value="">Seç</option>{ABILITY_KEYS.filter((key) => key !== "cha" && key !== draft.flexibleRaceAbilityPrimary).map((key) => <option key={key} value={key}>{key.toUpperCase()}</option>)}
                    </select>
                  </label>
                </> : null}
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
                  <p>Başlangıç skorları, origin bonusları ve level ASI artışları artık ayrı katmanlarda hesaplanır.</p>
                </div>
                <button type="button" onClick={applyStandardArray}>Standard Array’i Sıfırla</button>
              </div>

              <div className="ability-method-picker" role="group" aria-label="Ability oluşturma yöntemi">
                {(["standard-array", "point-buy", "rolled"] as const).map((method) => (
                  <button type="button" className={abilityMethod === method ? "active" : ""} key={method} onClick={() => {
                    setAbilityMethod(method);
                    if (method === "standard-array") applyStandardArray();
                    if (method === "point-buy") setDraft((current) => ({ ...current, abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } }));
                  }}>
                    {method === "standard-array" ? "Standard Array" : method === "point-buy" ? "Point Buy" : "Rolled / Manual"}
                  </button>
                ))}
              </div>

              <div className={`ability-budget-status ${abilityBudgetError ? "invalid" : "valid"}`}>
                <strong>{abilityBudgetError ? "Dağılım kurala uymuyor" : "Dağılım geçerli"}</strong>
                <span>{abilityBudgetError ?? (abilityMethod === "point-buy" ? `${getPointBuyRemaining(draft.abilities)} / 27 Point Buy puanı kaldı.` : abilityMethod === "standard-array" ? "15, 14, 13, 12, 10 ve 8 değerlerini istediğin ability’lere dağıt." : "Manuel skorlar nihai bonuslardan önce girilir.")}</span>
                {getSpentAsi(draft.abilityScoreIncreases) > asiBudget ? <button type="button" onClick={() => updateDraft("abilityScoreIncreases", {})}>ASI dağılımını sıfırla</button> : null}
              </div>

              <div className="ability-editor ability-editor-v2">
                {ABILITY_KEYS.map((ability) => {
                  const base = draft.abilities[ability];
                  const origin = originBonuses[ability] ?? 0;
                  const asi = draft.abilityScoreIncreases?.[ability] ?? 0;
                  const final = finalAbilities[ability];
                  return <article className="ability-input ability-layer-card" key={ability}>
                    <span>{ability.toUpperCase()}</span>
                    {abilityMethod === "standard-array" ? <select value={base} onChange={(event) => assignStandardArray(ability, Number(event.target.value))}>
                      {STANDARD_ARRAY_VALUES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select> : null}
                    {abilityMethod === "point-buy" ? <div className="ability-stepper"><button type="button" onClick={() => adjustPointBuy(ability, -1)} disabled={base <= 8}>−</button><strong>{base}</strong><button type="button" onClick={() => adjustPointBuy(ability, 1)} disabled={base >= 15}>+</button></div> : null}
                    {abilityMethod === "rolled" ? <NumberStepper value={base} min={3} max={20} label={`${ability.toUpperCase()} ability score`} onChange={(value) => updateAbility(ability, value)} /> : null}
                    <small>Başlangıç {base} · Origin {origin >= 0 ? "+" : ""}{origin} · Level {asi >= 0 ? "+" : ""}{asi}</small>
                    <strong className="ability-final-score">{final} ({formatModifier(getAbilityModifier(final))})</strong>
                  </article>;
                })}
              </div>

              <div className="form-panel nested-panel">
                <div className="panel-heading-row"><div><h3>Level ASI / Feat Bütçesi</h3><p>Level {draft.level} için featlerden sonra kalan ASI puanlarını burada dağıt.</p></div><span className="mini-label">{getSpentAsi(draft.abilityScoreIncreases)} / {asiBudget}</span></div>
                <div className="ability-asi-grid">
                  {ABILITY_KEYS.map((ability) => <div className="ability-asi-row" key={ability}><strong>{ability.toUpperCase()}</strong><button type="button" onClick={() => adjustAsi(ability, -1)} disabled={(draft.abilityScoreIncreases?.[ability] ?? 0) <= 0}>−</button><span>+{draft.abilityScoreIncreases?.[ability] ?? 0}</span><button type="button" onClick={() => adjustAsi(ability, 1)} disabled={getSpentAsi(draft.abilityScoreIncreases) >= asiBudget || finalAbilities[ability] >= 20}>+</button></div>)}
                </div>
                {asiBudget > 0 && getSpentAsi(draft.abilityScoreIncreases) < asiBudget ? <p className="validation-message warning">Kullanılmamış {asiBudget - getSpentAsi(draft.abilityScoreIncreases)} ASI puanı var. Feat seçebilir veya ability artışı dağıtabilirsin.</p> : null}
              </div>

              <div className="builder-choice-card">
                <span className="mini-label">Nihai Ability Dökümü</span>
                <h3>{ABILITY_KEYS.map((key) => `${key.toUpperCase()} ${finalAbilities[key]}`).join(" · ")}</h3>
                <p>Başlangıç yöntemi ile race/species/background ve level bonusları birbirine karıştırılmadan gösterilir.</p>
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

              {featSelectionNotice ? (
                <div className="ability-budget-status invalid" role="alert">
                  <strong>ASI ve feat aynı slotu kullanıyor</strong>
                  <span>{featSelectionNotice}</span>
                  <button type="button" onClick={() => { setDraft((current) => ({ ...current, abilityScoreIncreases: {} })); setFeatSelectionNotice(""); }}>ASI dağılımını sıfırla</button>
                </div>
              ) : null}

              {metamagicLimit ? <div className="ruleset-foundation-card"><div className="panel-heading-row"><div><span className="mini-label">Sorcerer Class Choice</span><strong>Metamagic</strong></div><span>{selectedMetamagicIds.length} / {metamagicLimit}</span></div><div className="builder-choice-grid">{metamagicOptions.map(option=>{const selected=selectedMetamagicIds.includes(option.id);return <article className={`builder-choice-card ${selected?"selected":""}`} key={option.id}><div className="panel-heading-row"><div><h3>{option.name}</h3><span className="mini-label">{option.cost} Sorcery Point</span></div><button type="button" disabled={!selected&&selectedMetamagicIds.length>=metamagicLimit} onClick={()=>toggleMetamagic(option.id)}>{selected?"Kaldır":"Seç"}</button></div><p>{option.summary}</p></article>})}</div></div>:null}

              {invocationLimit ? <div className="ruleset-foundation-card"><div className="panel-heading-row"><div><span className="mini-label">Warlock Class Choice</span><strong>Eldritch Invocations</strong></div><span>{selectedInvocationIds.length} / {invocationLimit}</span></div><div className="builder-choice-grid">{invocationOptions.map(option=>{const selected=selectedInvocationIds.includes(option.id);const eligible=isInvocationEligible(option,draft);const requirement=[option.minimumLevel?`Level ${option.minimumLevel}`:null,option.requiredSpellId?"Eldritch Blast":null].filter(Boolean).join(" · ");return <article className={`builder-choice-card ${selected?"selected":""}`} key={option.id}><div className="panel-heading-row"><div><h3>{option.name}</h3>{requirement?<span className="mini-label">Prerequisite: {requirement}</span>:<span className="mini-label">Prerequisite yok</span>}</div><button type="button" disabled={!selected&&(!eligible||selectedInvocationIds.length>=invocationLimit)} onClick={()=>toggleInvocation(option.id)}>{selected?"Kaldır":eligible?"Seç":"Kilitli"}</button></div><p>{option.summary}</p></article>})}</div></div>:null}

              {wildShapeLimit ? <div className="ruleset-foundation-card"><div className="panel-heading-row"><div><span className="mini-label">Druid Class Choice</span><strong>Wild Shape Forms</strong></div><span>{selectedWildShapeFormIds.length} / {wildShapeLimit} {draft.ruleset==="dnd_2014"?"favori":"bilinen"}</span></div><div className="builder-choice-grid">{wildShapeForms.map(form=>{const selected=selectedWildShapeFormIds.includes(form.id);const eligible=isWildShapeFormEligible(form,draft.level,draft.ruleset,draft.subclass);return <article className={`builder-choice-card ${selected?"selected":""}`} key={form.id}><div className="panel-heading-row"><div><h3>{form.name}</h3><span className="mini-label">CR {form.challengeRating} · AC {form.armorClass} · HP {form.hitPoints}</span></div><button type="button" disabled={!selected&&(!eligible||selectedWildShapeFormIds.length>=wildShapeLimit)} onClick={()=>toggleWildShapeForm(form.id)}>{selected?"Kaldır":eligible?"Seç":"Kilitli"}</button></div><p>{form.summary}</p><small>{form.movement}</small></article>})}</div></div>:null}

              {maneuverLimit?<div className="ruleset-foundation-card"><div className="panel-heading-row"><div><span className="mini-label">Battle Master Choice</span><strong>Combat Maneuvers · {getSuperiorityDie(draft.level)}</strong></div><span>{selectedManeuverIds.length} / {maneuverLimit}</span></div><div className="builder-choice-grid">{maneuverOptions.map(option=>{const selected=selectedManeuverIds.includes(option.id);return <article className={`builder-choice-card ${selected?"selected":""}`} key={option.id}><div className="panel-heading-row"><div><h3>{option.name}</h3><span className="mini-label">{option.trigger}</span></div><button type="button" disabled={!selected&&selectedManeuverIds.length>=maneuverLimit} onClick={()=>toggleManeuver(option.id)}>{selected?"Kaldır":"Seç"}</button></div><p>{option.summary}</p></article>})}</div></div>:null}

              {companionLimit?<div className="ruleset-foundation-card"><div className="panel-heading-row"><div><span className="mini-label">Beast Master Choice</span><strong>Ranger Companion</strong></div><span>{draft.companionId?1:0} / 1</span></div><div className="builder-choice-grid">{companionOptions.map(option=>{const selected=draft.companionId===option.id;const stats=getCompanionStats(option,draft.level,getAbilityModifier(finalAbilities.wis));return <article className={`builder-choice-card ${selected?"selected":""}`} key={option.id}><div className="panel-heading-row"><div><h3>{option.name}</h3><span className="mini-label">AC {stats.armorClass} · HP {stats.maxHp} · Attack {formatModifier(stats.attackBonus)}</span></div><button type="button" onClick={()=>selectCompanion(option.id)}>{selected?"Kaldır":"Seç"}</button></div><p>{option.summary}</p><small>{option.speed} · {option.attackName}: {stats.damage}</small></article>})}</div></div>:null}

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
                    abilities: preFeatAbilities,
                    canCastSpells,
                    armorTraining: selectedClass?.armorProficiencies,
                    hasFightingStyleFeature: fightingStyleLimit > 0,
                  });
                  const selected = draft.featIds.includes(feat.id);
                  const slotFull = !selected && draft.featIds.length >= generalFeatSlots;
                  const disabled = !eligibility.eligible || slotFull;

                  return (
                    <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={feat.id}>
                      <div className="panel-heading-row">
                        <div>
                          <span className="mini-label">{feat.category === "epic-boon" ? "Epic Boon" : feat.category === "origin" ? "Origin Feat" : feat.category === "fighting-style" ? "Fighting Style" : "General Feat"}</span>
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
                      {selected && feat.abilityOptions?.length ? <label className="level-up-manual-field">Ability artışı<select value={draft.featChoices?.[feat.id]?.[0] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, featChoices: { ...(current.featChoices ?? {}), [feat.id]: event.target.value ? [event.target.value] : [] } }))}><option value="">Ability seç...</option>{feat.abilityOptions.map((ability) => <option key={ability} value={ability}>{ability.toUpperCase()}</option>)}</select></label> : null}
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

              {fightingStyleLimit ? (
                <div className="fighting-style-builder">
                  <div className="panel-heading-row"><div><h3>Fighting Style</h3><p>Class ve level tarafından açılan savaş uzmanlığını seç.</p></div><span className="mini-label">{selectedFightingStyleIds.length} / {fightingStyleLimit}</span></div>
                  <div className="builder-choice-grid">
                    {fightingStyles.map((style) => {
                      const selected = selectedFightingStyleIds.includes(style.id);
                      return <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={style.id}><div className="panel-heading-row"><h3>{style.name}</h3><button type="button" disabled={!selected && selectedFightingStyleIds.length >= fightingStyleLimit} onClick={() => toggleFightingStyle(style.id)}>{selected ? "Kaldır" : "Seç"}</button></div><p>{style.summary}</p></article>;
                    })}
                  </div>
                </div>
              ) : null}

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
            <><CharacterSpellSelector
              title="Karakter Spellbook"
              description="Bu karakterin bildiği cantripleri ve hazırladığı büyüleri seç. Slotlar karakter detayında takip ediliyor."
              rulesetData={rulesetData}
              isRulesetLoading={isRulesetLoading}
              rulesetError={rulesetError}
              className={draft.className}
              subclassName={draft.subclass}
              characterLevel={draft.level}
              abilities={finalAbilities}
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
            {arcanumLevels.length?<section className="form-panel"><div className="panel-heading-row"><div><span className="mini-label">Warlock High Magic</span><h2>Mystic Arcanum</h2></div><span>{(draft.arcanumSpellIds??[]).length} / {arcanumLevels.length}</span></div>{arcanumLevels.map(level=><div className="ruleset-foundation-card" key={level}><h3>Level {level} Arcanum</h3><div className="builder-choice-grid">{arcanumOptions.filter(spell=>spell.level===level).map(spell=>{const selected=draft.arcanumSpellIds?.includes(spell.id);return <article className={`builder-choice-card ${selected?"selected":""}`} key={spell.id}><div className="panel-heading-row"><h3>{spell.name}</h3><button type="button" onClick={()=>selectArcanum(spell.id,level)}>{selected?"Kaldır":"Seç"}</button></div><p>{spell.description}</p></article>})}</div></div>)}</section>:null}</>
          ) : null}

          {activeStep.id === "equipment" ? (
            <><CharacterInventoryManager
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
            {masteryLimit ? <section className="form-panel"><div className="panel-heading-row"><div><h2>Weapon Mastery</h2><p>Class progression tarafından açılan silah uzmanlıklarını seç.</p></div><span className="mini-label">{masteredWeaponIds.length} / {masteryLimit}</span></div><div className="builder-choice-grid">{masteryWeapons.map((weapon) => { const selected=masteredWeaponIds.includes(weapon.id); return <article className={`builder-choice-card ${selected ? "selected" : ""}`} key={weapon.id}><div className="panel-heading-row"><div><h3>{weapon.name}</h3><span className="mini-label">{getWeaponMastery(weapon,draft.ruleset)}</span></div><button type="button" disabled={!selected&&masteredWeaponIds.length>=masteryLimit} onClick={()=>toggleWeaponMastery(weapon.id)}>{selected?"Kaldır":"Seç"}</button></div><p>{weapon.damage} {weapon.damageType} · {weapon.properties?.join(", ")||"—"}</p></article>; })}</div></section>:null}</>
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
                <div>
                  <span>Fighting Styles</span>
                  <strong>{selectedFightingStyleIds.length ? fightingStyles.filter((style) => selectedFightingStyleIds.includes(style.id)).map((style) => style.name).join(", ") : "—"}</strong>
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
