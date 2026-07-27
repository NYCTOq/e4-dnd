# Spell Runtime & Combat Discovery v5.113A

- Status: **READY**
- Scanned files: **560**
- Matched files: **302**

## Highest-signal files

- `src/features/characters/CharacterDetail.tsx` — score 11, exports: CharacterDetail
- `src/features/play-mode/PlayMode.tsx` — score 11, exports: PlayMode
- `src/features/builder/Builder.tsx` — score 9, exports: Builder
- `src/shared/release/releaseNotes.ts` — score 9, exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/certification/oracle/spellRuntimeCombatOracle.test.ts` — score 8, exports: none
- `src/certification/reference/spellRuntimeCombat.reference.ts` — score 8, exports: DamageRelation, SpellAbility, SpellRulesetId, applyDamageRelation, applyHealing, applySavingThrowDamage, canCastWithSlot, cantripScalingDice, concentrationAfterDamage, consumeSpellSlot, resolveTargetCount, restoreSpellSlot, spellAbilityModifier, spellAttackBonus, spellProficiencyBonus, spellSaveDc, upcastDiceCount
- `src/core/rulesets/globalSpellRuntime.test.ts` — score 7, exports: none
- `src/core/rulesets/globalSpellRuntime.ts` — score 7, exports: SaveDamageRule, SpellRuntimeOutcome, SpellRuntimePlan, SpellRuntimeTier, dispelSpellEffects, endConcentration, getDefaultSpellSaveRule, getGlobalCastableSlotLevels, getSpellRuntimePlan, resolveGlobalSpell, resolveSpellHealing, resolveSpellSave
- `src/core/rulesets/spellExpansion.ts` — score 7, exports: SPELL_EXPANSION_2014, SPELL_EXPANSION_2024
- `src/core/rulesets/subclassExpansion.ts` — score 7, exports: SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024
- `src/features/characters/characterShared.tsx` — score 7, exports: CharacterInventoryManager, CharacterSpellSelector, ClassBasedSpellSelector, FULL_CASTER_CLASSES, FULL_CASTER_SLOT_TABLE, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getDefaultSpellSlots, getEquippedItems, getHitDieForClass, getInventoryQuantity, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAbilityModifier, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeCharacterDraft, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, setInventoryItemQuantity, sortSpellsByLevelAndName
- `src/core/character/character.types.ts` — score 6, exports: AbilityKey, AbilityScores, ArmorClassMode, Character, CharacterClassLevel, CharacterCondition, CharacterConditionDurations, CharacterDeathSaves, CharacterDraft, CharacterHitDiePool, CharacterInventoryItem, CharacterResource, CharacterSpellEffect, CharacterSpellSlot, ResourceRecovery, RulesetId
- `src/core/rulesets/ruleset.types.ts` — score 6, exports: ClassLevelData, DndArmorType, DndBackgroundData, DndClassData, DndFeatData, DndFeatPrerequisite, DndItemCategory, DndItemData, DndMonsterData, DndRaceData, DndSpellData, DndSubclassData, DndSubraceData, FeatCategory, RulesetData, SkillChoices, SpellEffectType, SpellProgression, SpellResolutionType, SpellScalingData, SubclassFeatureData, WeaponCategory, WeaponMastery
- `src/core/rulesets/runtimeCoverageCertification.ts` — score 6, exports: RuntimeCategory, RuntimeCoverageCertification, RuntimeEntity, RuntimeTier, classifyFeat, classifyItem, classifySpell, classifySubclass, getRuntimeCoverageCertification
- `src/features/homebrew/HomebrewLab.tsx` — score 6, exports: HomebrewLab
- `src/core/character/sheetPlayModeConsistency.ts` — score 5, exports: WeaponConsistencyRow, compareSheetAndPlayMode, getSheetPlayModeConsistencySnapshot, getWeaponConsistencyRows
- `src/core/homebrew/homebrewContentRuntimeIntegration.ts` — score 5, exports: HomebrewContentRuntime, HomebrewFeatRuntime, HomebrewItemRuntime, HomebrewSpellRuntime, applyHomebrewFeatAbilityBonus, applyHomebrewSpellSelfEffect, getHomebrewContentRuntime, spendHomebrewItemCharge
- `src/core/rulesets/equipmentMagicItemFinalCoverage.ts` — score 5, exports: EquipmentCoverageDisposition, EquipmentCoverageEntry, EquipmentCoverageFamily, EquipmentMagicItemCoverageReport, buildEquipmentMagicItemCoverageReport, certifyEquipmentItem, formatEquipmentMagicItemCoverageSummary, previewItemRuntime
- `src/core/rulesets/itemExpansion.ts` — score 5, exports: ITEM_EXPANSION_2014, ITEM_EXPANSION_2024
- `src/core/rulesets/rangerBuilderCertification.ts` — score 5, exports: RangerCertificationRow, certifyRangerBuilder, summarizeRangerCertification
