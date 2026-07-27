# Rest UI Integration Contract v5.111D1

- Status: **READY**
- Scanned files: **560**
- Matched files: **187**
- Rest Center candidates: **10**
- Character Detail candidates: **10**
- Storage candidates: **10**
- Router candidates: **10**
- Test IDs found: **10**

## Highest-signal Rest Center files

- `src/features/rest/RestCenterPage.tsx` — exports: RestCenterPage
- `src/shared/release/releaseNotes.ts` — exports: getCurrentRelease
- `src/core/rulesets/classSpecificRuntimePolicy.ts` — exports: getClassSpecificRuntimePolicyReport
- `src/certification/golden/restRecoveryGoldenCharacters.test.ts` — exports: none
- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode

## Highest-signal Character Detail files

- `src/features/play-mode/PlayMode.tsx` — exports: PlayMode
- `src/features/combat-tracker/combatTrackerStorage.ts` — exports: addCombatLog, advanceTurn, applyDamage, applyHealing, createBattlefieldZone, createCombatEffect, createCombatEncounter, createCombatLogEntry, createCombatTemplate, createCombatant, createEncounterFromCampaignEncounter, createEncounterFromTemplate, getActiveConditions, getCombatSummary, loadCombatEncounters, loadCombatTemplates, sanitizeCombatEncounter, sanitizeCombatant, saveCombatEncounters, saveCombatTemplates, sortCombatants, tickBattlefieldZones, tickCombatEffects
- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/features/campaigns/Campaigns.tsx` — exports: Campaigns
- `src/core/rulesets/restRecoveryRules.ts` — exports: applyLongRest, applyRest, applyShortRest, normalizeRestState, recoverHitDice, recoverResources, recoverSpellSlots, spendHitDie, spendResource, spendSpellSlot, usedHitDice, usedSpellSlots

## Highest-signal Storage files

- `src/features/characters/CharacterDetail.tsx` — exports: CharacterDetail
- `src/features/legacy/LegacyApp.tsx` — exports: App
- `src/core/storage/safeStorage.ts` — exports: STORAGE_RECOVERY_EVENT, clearRecoveryRecords, downloadEmergencyStorageSnapshot, downloadRecoveryRecord, loadRecoveryRecords, quarantineStorageValue, readJsonSafely, removeRecoveryRecord, writeJsonSafely
- `src/features/combat-tracker/combatTrackerStorage.ts` — exports: addCombatLog, advanceTurn, applyDamage, applyHealing, createBattlefieldZone, createCombatEffect, createCombatEncounter, createCombatLogEntry, createCombatTemplate, createCombatant, createEncounterFromCampaignEncounter, createEncounterFromTemplate, getActiveConditions, getCombatSummary, loadCombatEncounters, loadCombatTemplates, sanitizeCombatEncounter, sanitizeCombatant, saveCombatEncounters, saveCombatTemplates, sortCombatants, tickBattlefieldZones, tickCombatEffects
- `src/core/storage/characterStorage.ts` — exports: exportCharacters, hydrateCharacterRecord, loadCharacters, saveCharacters

## Routes

- `/`
- `/backup`
- `/builder`
- `/calendar`
- `/campaigns`
- `/characters`
- `/characters/:characterId`
- `/characters/:characterId/edit`
- `/characters/compare`
- `/classes`
- `/collections`
- `/combat`
- `/dice`
- `/factions`
- `/feats`
- `/help`
- `/homebrew-lab`
- `/inventory`
- `/library`
- `/locations`
- `/loot`
- `/monsters`
- `/monsters/:monsterId`
- `/npcs`
- `/origins`
- `/play-mode`
- `/player-test`
- `/quests`
- `/rest`
- `/rulesets`
- `/search`
- `/session-planner`
- `/settings`
- `/spellbook`
- `/subclasses`
- `/updates`

## Test IDs

- `ancestry-choice-panel`
- `backup-safety-report`
- `builder-character-name`
- `builder-review`
- `builder-save`
- `class-runtime-policy`
- `combat-turn-automation`
- `content-completion-plan`
- `content-integrity-audit`
- `inventory-economy-panel`
