# Death, Dying, Stabilization & Revival Discovery v5.115A

- Status: **READY**
- Scanned files: **613**
- Matched files: **403**
- HP runtime candidates: **40**
- Death save candidates: **40**
- Combat candidates: **39**
- Character Detail candidates: **40**
- Persistence candidates: **40**

## Highest-signal death-save files

- `src/certification/reference/deathDying.reference.ts` — exports: DeathSaveState, applyDeathSaveRoll, clampDeathSaveCount, damageAtZeroFailureCount, deathSaveRollOutcome, healFromZero, massiveDamageKills, normalizeDeathSaveState, resetDeathSaves, stabilizeDeathSaveState
- `src/certification/oracle/deathDyingOracle.test.ts` — exports: none
- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/core/character/survivalRules.ts` — exports: DamageResult, SurvivalState, applyDamage, applyHealing, getConcentrationDc, resolveDeathSave
- `src/core/rulesets/combatAutomationRuntime.ts` — exports: CombatAutomationState, DeathSaveState, beginAutomatedTurn, createCombatAutomationState, createDeathSaveState, ensureCombatantAutomation, registerConcentrationDamage, resetDeathSaves, resolveDeathSave, spendAutomatedMovement, spendAutomatedResource
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/features/campaigns/encounterDifficulty.ts` — exports: EncounterDifficulty, EncounterDifficultyResult, EncounterThresholds, calculateEncounterDifficulty
- `src/certification/golden/restRecoveryGoldenCharacters.test.ts` — exports: none
- `src/core/release/stablePlayerRelease.ts` — exports: STABLE_PLAYER_GUARANTEES, STABLE_PLAYER_RELEASE_CHANNEL, STABLE_PLAYER_RELEASE_VERSION, StablePlayerReleaseInput, StablePlayerReleaseManifest, buildStablePlayerReleaseManifest, formatStablePlayerReleaseSummary
- `src/shared/release/releaseNotes.ts` — exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/core/rulesets/combatStatusRules.ts` — exports: DeathSaveStatus, advanceConditionDurations, getCombatStatusLabel, getDeathSaveStatus, shouldRequestConcentrationSave
- `src/features/characters/characterShared.tsx` — exports: CharacterInventoryManager, CharacterSpellSelector, ClassBasedSpellSelector, FULL_CASTER_CLASSES, FULL_CASTER_SLOT_TABLE, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getDefaultSpellSlots, getEquippedItems, getHitDieForClass, getInventoryQuantity, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAbilityModifier, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeCharacterDraft, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, setInventoryItemQuantity, sortSpellsByLevelAndName
- `src/core/rulesets/restRecoveryRules.ts` — exports: ActiveEffect, HitDiePool, ResourcePool, RestKind, RestRecoveryState, RestRulesetId, RestState, SpellSlotPool, applyLongRest, applyRest, applyShortRest, normalizeRestState, recoverHitDice, recoverResources, recoverSpellSlots, spendHitDie, spendResource, spendSpellSlot, usedHitDice, usedSpellSlots
- `src/core/character/survivalRules.test.ts` — exports: none
- `src/core/rulesets/combatStatusRules.test.ts` — exports: none

## Highest-signal HP/combat files

- `src/features/play-mode/PlayMode.tsx`
- `src/core/rulesets/spellExpansion.ts`
- `src/features/characters/CharacterDetail.tsx`
- `src/core/rulesets/itemExpansion.ts`
- `src/features/homebrew/HomebrewLab.tsx`
- `src/features/combat-tracker/combatTrackerStorage.ts`
- `src/shared/release/releaseNotes.ts`
- `src/core/character/survivalRules.ts`
- `src/features/monsters/MonsterLibrary.tsx`
- `src/core/rulesets/spellCharacterCombatAdapter.ts`
- `src/features/combat-tracker/CombatTrackerPage.tsx`
- `src/features/combat-tracker/combatTrackerStorage.ts`
- `src/core/rulesets/combatAutomationRuntime.ts`
- `src/features/combat-tracker/combatTrackerStorage.test.ts`
- `src/features/combat-tracker/battlefieldZones.test.ts`
- `src/features/combat-tracker/combatEncounterBridge.test.ts`
- `src/features/combat-tracker/CombatTurnAutomationPanel.tsx`
- `src/certification/oracle/equipmentCombatOracle.ts`
- `src/core/rulesets/combatTurnRules.ts`
- `src/core/rulesets/combatAutomationRuntime.test.ts`
