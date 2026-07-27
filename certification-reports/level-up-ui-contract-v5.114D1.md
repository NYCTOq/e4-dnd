# Level-Up UI Integration Contract v5.114D1

- Status: **READY**
- Scanned files: **611**
- Matched files: **540**
- Builder candidates: **30**
- Character Detail candidates: **30**
- Play Mode candidates: **30**
- Level-Up candidates: **30**
- ASI/Feat candidates: **30**
- Subclass candidates: **30**
- Persistence candidates: **30**
- Test IDs: **48**
- Storage keys: **10**

## Builder

- `src/features/builder/Builder.tsx` — exports: Builder
- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/features/legacy/AppRoutes.tsx` — exports: AppRoutes
- `src/features/characters/CharacterEditor.tsx` — exports: CharacterEditor
- `src/core/rulesets/singleClassBuilderFinalCertification.integration.test.ts` — exports: none
- `src/features/characters/characterShared.tsx` — exports: CharacterInventoryManager, CharacterSpellSelector, ClassBasedSpellSelector, FULL_CASTER_CLASSES, FULL_CASTER_SLOT_TABLE, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getDefaultSpellSlots, getEquippedItems, getHitDieForClass, getInventoryQuantity, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAbilityModifier, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeCharacterDraft, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, setInventoryItemQuantity, sortSpellsByLevelAndName
- `src/features/rulesets/RulesetCenterPage.tsx` — exports: RulesetCenterPage
- `src/shared/release/releaseNotes.ts` — exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/features/legacy/LegacyApp.tsx` — exports: none

## Character Detail

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/features/builder/Builder.tsx` — exports: Builder
- `src/shared/release/releaseNotes.ts` — exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/features/characters/characterShared.tsx` — exports: CharacterInventoryManager, CharacterSpellSelector, ClassBasedSpellSelector, FULL_CASTER_CLASSES, FULL_CASTER_SLOT_TABLE, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getDefaultSpellSlots, getEquippedItems, getHitDieForClass, getInventoryQuantity, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAbilityModifier, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeCharacterDraft, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, setInventoryItemQuantity, sortSpellsByLevelAndName
- `src/features/characters/LevelUpAssistant.tsx` — exports: LevelUpAssistant
- `src/core/rulesets/levelUpCharacterAdapter.ts` — exports: AbilityKey, CharacterClassEntry, LevelUpChoice, LevelUpCompatibleCharacter, LevelUpHistoryEntry, applyAbilityIncreases, applyCharacterLevelUp, applyFeatSelection, deserializeLevelUpCharacter, normalizeLevelUpCharacter, serializeLevelUpCharacter
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/rulesets/multiclassRules.ts` — exports: addClassLevel, getClassLevel, getCombinedCasterLevel, getMulticlassAttacksPerAction, getMulticlassConflictSummary, getMulticlassEligibility, getMulticlassHitDice, getMulticlassPactMagicSlots, getMulticlassProficiencyGains, getMulticlassSpellSlots, getMulticlassTransitionEligibility, normalizeClassLevels
- `src/core/rulesets/levelUpProgressionRules.ts` — exports: LevelUpCharacterState, LevelUpClassState, LevelUpMilestone, LevelUpRuleset, runtimeAbilityModifier, runtimeApplySingleClassLevelUp, runtimeAsiLevel, runtimeBuildMilestone, runtimeCanLevelUp, runtimeCantripTier, runtimeClampLevel, runtimeGainsSubclass, runtimeLevelUpHpGain, runtimeNextLevel, runtimeProgressionPb, runtimeSpellTier, runtimeSubclassUnlockLevel, runtimeTotalLevel
- `src/core/rulesets/warlockBuilderCertification.ts` — exports: WarlockCertificationRow, certifyWarlockBuilder, summarizeWarlockCertification

## Play Mode

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/shared/release/releaseNotes.ts` — exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/core/character/sheetPlayModeConsistency.test.ts` — exports: none
- `src/core/character/sheetPlayModeConsistency.ts` — exports: WeaponConsistencyRow, compareSheetAndPlayMode, getSheetPlayModeConsistencySnapshot, getWeaponConsistencyRows
- `src/features/campaigns/Campaigns.tsx` — exports: Campaigns
- `src/features/legacy/AppRoutes.tsx` — exports: AppRoutes
- `src/features/characters/levelUpHistory.ts` — exports: LevelUpHistoryEntry, getLatestLevelUp, loadLevelUpHistory, removeLevelUpHistoryEntry, saveLevelUpSnapshot
- `src/features/help/HelpCenter.tsx` — exports: HelpCenter
- `src/features/loot/lootTrackerStorage.ts` — exports: LootKind, LootRecord, LootStatus, calculateLootTotal, createLootRecord, loadLootRecords, sanitizeLootRecord, saveLootRecords

## Persistence

- `src/features/legacy/AppRoutes.tsx` — keys: none
- `src/features/characters/CharacterDetail.tsx` — keys: none
- `src/features/legacy/LegacyApp.tsx` — keys: none
- `src/features/play-mode/PlayMode.tsx` — keys: none
- `src/core/rulesets/restRecoveryPersistenceBridge.ts` — keys: none
- `src/features/characters/Characters.tsx` — keys: none
- `src/features/backup/DataBackup.tsx` — keys: none
- `src/core/rulesets/classFeaturePersistenceBridge.ts` — keys: none
- `src/core/rulesets/spellCastingPersistenceBridge.ts` — keys: none
- `src/core/rulesets/levelUpPersistenceBridge.ts` — keys: none
