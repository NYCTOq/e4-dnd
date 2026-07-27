# Spell UI Integration Contract v5.113D1

- Status: **READY**
- Scanned files: **596**
- Matched files: **401**
- Spellbook candidates: **20**
- Play Mode candidates: **20**
- Combat Tracker candidates: **20**
- Storage candidates: **20**
- Test IDs: **37**

## Spellbook

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/features/builder/Builder.tsx` — exports: Builder
- `src/core/rulesets/spellCharacterCombatAdapter.ts` — exports: CharacterSpellEntry, SpellAbilityKey, SpellCompatibleCharacter, SpellRuntimeSnapshot, SpellSlotState, applyConcentrationDamage, applyDamageToSpellTarget, applyHealingToSpellTarget, buildSpellRuntimeSnapshot, canCharacterCastSpell, deserializeSpellCompatibleCharacter, normalizeSpellSlots, resolveSpellAbilityScore, resolveSpellcastingAbility, restoreCharacterSpellSlot, serializeSpellCompatibleCharacter, setCharacterConcentration, spendCharacterSpellSlot
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/rulesets/levelOneRestReadiness.ts` — exports: LevelOneRestReadiness, getLevelOneRestReadiness
- `src/features/characters/characterShared.tsx` — exports: CharacterInventoryManager, CharacterSpellSelector, ClassBasedSpellSelector, FULL_CASTER_CLASSES, FULL_CASTER_SLOT_TABLE, calculateEffectiveArmorClass, calculateSuggestedArmorClass, createCharacterFromDraft, emptyDraft, getCharacterInventoryItems, getDefaultSpellSlots, getEquippedItems, getHitDieForClass, getInventoryQuantity, getInventoryWeight, getItemCategoryLabel, getItemRulesSummary, getSpellGroupTitle, getSpellLevelGroups, getSpellLevelLabel, getWeaponAbilityModifier, getWeaponAttackBonus, getWeaponDamageSummary, isSpellReadyToCast, normalizeCharacterDraft, normalizeHitDice, normalizeSpellSlots, resetDeathSaves, resetHitDice, resetSpellSlots, setInventoryItemQuantity, sortSpellsByLevelAndName
- `src/core/rulesets/restRecoveryRules.ts` — exports: ActiveEffect, HitDiePool, ResourcePool, RestKind, RestRecoveryState, RestRulesetId, RestState, SpellSlotPool, applyLongRest, applyRest, applyShortRest, normalizeRestState, recoverHitDice, recoverResources, recoverSpellSlots, spendHitDie, spendResource, spendSpellSlot, usedHitDice, usedSpellSlots
- `src/features/spellbook/Spellbook.tsx` — exports: Spellbook

## Play Mode

- `src/core/rulesets/spellExpansion.ts` — exports: SPELL_EXPANSION_2014, SPELL_EXPANSION_2024
- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/core/character/sheetPlayModeConsistency.ts` — exports: WeaponConsistencyRow, compareSheetAndPlayMode, getSheetPlayModeConsistencySnapshot, getWeaponConsistencyRows
- `src/core/character/sheetPlayModeConsistency.test.ts` — exports: none
- `src/core/rulesets/spellCharacterCombatAdapter.ts` — exports: CharacterSpellEntry, SpellAbilityKey, SpellCompatibleCharacter, SpellRuntimeSnapshot, SpellSlotState, applyConcentrationDamage, applyDamageToSpellTarget, applyHealingToSpellTarget, buildSpellRuntimeSnapshot, canCharacterCastSpell, deserializeSpellCompatibleCharacter, normalizeSpellSlots, resolveSpellAbilityScore, resolveSpellcastingAbility, restoreCharacterSpellSlot, serializeSpellCompatibleCharacter, setCharacterConcentration, spendCharacterSpellSlot
- `src/certification/golden/spellRuntimeGoldenCasters.test.ts` — exports: none
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/components/spells/SpellCastingRuntimePanel.tsx` — exports: SpellCastingRuntimePanel, SpellCastingRuntimePanelProps

## Combat Tracker

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/core/rulesets/spellExpansion.ts` — exports: SPELL_EXPANSION_2014, SPELL_EXPANSION_2024
- `src/features/combat-tracker/CombatTrackerPage.tsx` — exports: CombatTrackerPage
- `src/features/combat-tracker/combatTrackerStorage.ts` — exports: BATTLEFIELD_ZONE_KINDS, BATTLEFIELD_ZONE_SHAPES, BattlefieldZone, BattlefieldZoneKind, BattlefieldZoneShape, COMBAT_CONDITIONS, CombatCondition, CombatEffect, CombatEncounter, CombatLogEntry, CombatLogKind, CombatTemplate, CombatTemplateCombatant, Combatant, CombatantKind, addCombatLog, advanceTurn, applyDamage, applyHealing, createBattlefieldZone, createCombatEffect, createCombatEncounter, createCombatLogEntry, createCombatTemplate, createCombatant, createEncounterFromCampaignEncounter, createEncounterFromTemplate, getActiveConditions, getCombatSummary, loadCombatEncounters, loadCombatTemplates, sanitizeCombatEncounter, sanitizeCombatant, saveCombatEncounters, saveCombatTemplates, sortCombatants, tickBattlefieldZones, tickCombatEffects
- `src/features/homebrew/HomebrewLab.tsx` — exports: HomebrewLab
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/rulesets/itemExpansion.ts` — exports: ITEM_EXPANSION_2014, ITEM_EXPANSION_2024
- `src/core/rulesets/combatAutomationRuntime.ts` — exports: CombatAutomationState, DeathSaveState, beginAutomatedTurn, createCombatAutomationState, createDeathSaveState, ensureCombatantAutomation, registerConcentrationDamage, resetDeathSaves, resolveDeathSave, spendAutomatedMovement, spendAutomatedResource
