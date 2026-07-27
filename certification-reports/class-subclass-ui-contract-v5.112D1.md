# Class/Subclass UI Integration Contract v5.112D1

- Status: **READY**
- Scanned files: **575**
- Matched files: **300**
- Character Detail candidates: **15**
- Play Mode candidates: **15**
- Storage candidates: **15**
- Test IDs: **15**

## Character Detail

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/certification/golden/classSubclassGoldenCharacters.test.ts` — exports: none
- `src/core/rulesets/classSpecificRuntimePolicy.ts` — exports: CLASS_RUNTIME_EXPECTATIONS, ClassRuntimeArea, ClassRuntimeAreaReport, ClassRuntimeExpectation, ClassRuntimeState, ClassSpecificRuntimePolicyReport, ClassSpecificRuntimeReport, getClassSpecificRuntimePolicyReport
- `src/core/rulesets/classSubclassCharacterAdapter.ts` — exports: CharacterClassEntry, ClassCompatibleCharacter, ClassRuntimeSnapshot, applyClassFeatureRest, buildClassRuntimeSnapshot, characterClassEntries, characterClassLevels, deserializeClassCompatibleCharacter, resolveClassRuleset, serializeClassCompatibleCharacter, subclassUnlockState
- `src/core/rulesets/characterSheetRules.ts` — exports: SKILL_ABILITIES, getCharacterFeatures, getPassiveScore, getSavingThrowBonus, getSkillBonus
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/rulesets/arcaneClassRuntime.ts` — exports: ArcaneClassRuntime, ArcaneRecoveryType, getArcaneClassRuntime
- `src/core/rulesets/fighterBuilderCertification.ts` — exports: FighterCertificationRow, certifyFighterBuilder, summarizeFighterCertification

## Play Mode

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/shared/release/releaseNotes.ts` — exports: RELEASE_CATEGORIES, RELEASE_NOTES, ReleaseCategory, ReleaseChange, ReleaseEntry, getCurrentRelease
- `src/core/rulesets/levelOneActionEconomyReadiness.ts` — exports: LevelOneActionEconomyReadiness, getLevelOneActionEconomyReadiness
- `src/core/rulesets/subclassRuntimeRules.ts` — exports: SubclassActionType, SubclassRuntime, SubclassRuntimeAction, canUseSubclassAction, getSubclassRuntime, spendSubclassActionResource
- `src/core/homebrew/homebrewRuntimeIntegration.ts` — exports: HomebrewCharacterRuntime, HomebrewRuntimeActionState, HomebrewRuntimeResource, executeHomebrewRuntimeAction, getHomebrewCharacterEntities, getHomebrewCharacterRuntime, recoverHomebrewCharacterResources, synchronizeHomebrewResources
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/rulesets/levelOneRestReadiness.ts` — exports: LevelOneRestReadiness, getLevelOneRestReadiness
- `src/core/character/sheetPlayModeConsistency.test.ts` — exports: none

## Storage

- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/core/storage/safeStorage.ts` — exports: RecoveryRecord, STORAGE_RECOVERY_EVENT, clearRecoveryRecords, downloadEmergencyStorageSnapshot, downloadRecoveryRecord, loadRecoveryRecords, quarantineStorageValue, readJsonSafely, removeRecoveryRecord, writeJsonSafely
- `src/features/legacy/LegacyApp.tsx` — exports: none
- `src/features/combat-tracker/combatTrackerStorage.ts` — exports: BATTLEFIELD_ZONE_KINDS, BATTLEFIELD_ZONE_SHAPES, BattlefieldZone, BattlefieldZoneKind, BattlefieldZoneShape, COMBAT_CONDITIONS, CombatCondition, CombatEffect, CombatEncounter, CombatLogEntry, CombatLogKind, CombatTemplate, CombatTemplateCombatant, Combatant, CombatantKind, addCombatLog, advanceTurn, applyDamage, applyHealing, createBattlefieldZone, createCombatEffect, createCombatEncounter, createCombatLogEntry, createCombatTemplate, createCombatant, createEncounterFromCampaignEncounter, createEncounterFromTemplate, getActiveConditions, getCombatSummary, loadCombatEncounters, loadCombatTemplates, sanitizeCombatEncounter, sanitizeCombatant, saveCombatEncounters, saveCombatTemplates, sortCombatants, tickBattlefieldZones, tickCombatEffects
- `src/core/storage/characterStorage.ts` — exports: exportCharacters, hydrateCharacterRecord, loadCharacters, saveCharacters
- `src/features/campaigns/campaignStorage.test.ts` — exports: none
- `src/features/downtime/campaignCalendarStorage.ts` — exports: CalendarEventType, CampaignCalendar, CampaignCalendarEvent, DowntimeActivity, DowntimeStatus, advanceCampaignDays, createCampaignCalendar, getDowntimeProgress, getUpcomingEvents, loadCampaignCalendars, sanitizeCampaignCalendar, saveCampaignCalendars
- `src/features/factions/factionStorage.ts` — exports: FactionKind, FactionRecord, FactionRelation, FactionStanding, createFactionRecord, loadFactionRecords, removeFactionAndRelations, sanitizeFactionRecord, saveFactionRecords
