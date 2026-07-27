# Rest / Recovery Runtime Discovery v5.111A

- Scanned source files: **532**
- Matched files: **176**

## Capability counts

- shortRest: **16** candidate file(s)
- longRest: **16** candidate file(s)
- hitDice: **41** candidate file(s)
- spellSlots: **29** candidate file(s)
- resources: **83** candidate file(s)
- exhaustion: **47** candidate file(s)
- deathSaves: **9** candidate file(s)
- concentration: **78** candidate file(s)

## Highest signal files

- `src/shared/release/releaseNotes.ts` — short rest, long rest, hit dice, hit die, spell slot, resource, exhaustion, death save, concentration, active spell effect, temporary hp, temp hp — exports: getCurrentRelease
- `src/features/characters/CharacterDetail.tsx` — short rest, long rest, hit die, spell slot, resource, exhaustion, death save, concentration, temp hp — exports: CharacterDetail, adjustResource, advanceConditionRound, canCastSpell, castSpell, clearDeathSaves, deleteCurrentCharacter, getBasicSpellRoll, getResolutionLabel, getSpellEffectValue, longRest, parseDiceNotation, quickCharacterRoll, spendHitDie, toggleCondition, togglePreparedSpell, updateConditionDuration, updateDeathSave, updateExhaustion, updateHp, updateTempHp
- `src/features/play-mode/PlayMode.tsx` — short rest, long rest, spell slot, resource, exhaustion, death save, concentration, temp hp — exports: PlayMode, activateChannelDivinity, advanceEffectRound, applyArcaneRecovery, castArcanum, castSpell, commit, concentrationSave, consumeItem, convertSlotToSorceryPoints, createSorcerySlot, divineSmite, endSpellEffect, executeClassAction, executeHomebrewAction, grantBardicInspiration, handleDefensiveFightingStyle, handleFeatAction, handleSubclassAction, healDamage, longRest, monkAction, quickRoll, resolvedCheck, rollDeathSave, shortRest, spendMagicItemCharge, spendSlot, spendSorceryPoints, syncHomebrewResources, takeDamage, toggleAttunement, toggleCondition, unarmedStyleAttack, updateCompanionHp, updateHp, useActionSurge, useFavoredEnemy, useIndomitable, useSuperiorityDie, useWildShape, weaponAttack
- `src/certification/oracle/restRecoveryOracle.test.ts` — short rest, long rest, hit dice, hit die, spell slot, resource, exhaustion — exports: none detected
- `src/core/rulesets/levelOneRestReadiness.ts` — short rest, long rest, hit dice, hit die, spell slot, resource, exhaustion — exports: getLevelOneRestReadiness, validHitDie, validResource, validSlot
- `src/features/rest/RestCenterPage.tsx` — short rest, long rest, hit dice, spell slot, resource, exhaustion, death save — exports: RestCenterPage, addResource, applyRest, changeKind, toggleCharacter, undoLast, updateResources
- `src/core/rulesets/playerJourneyIntegration.test.ts` — short rest, long rest, hit dice, spell slot, resource, exhaustion — exports: none detected
- `src/features/rest/restSheetPlayIntegration.test.ts` — short rest, long rest, resource, exhaustion, concentration, active spell effect — exports: none detected
- `src/core/rulesets/subclassExpansion.ts` — long rest, spell slot, resource, concentration, temporary hp — exports: none detected
- `src/features/rest/restAutomation.test.ts` — short rest, long rest, hit dice, resource, exhaustion — exports: none detected
- `src/core/rulesets/classFeatureRuntime.ts` — short rest, spell slot, resource, concentration — exports: applyClassFeatureUse, canUseClassFeature, endClassFeatureCondition, getClassFeatureRuntimePlan, getRemainingClassResource
- `src/core/rulesets/levelOneSupportReadiness.test.ts` — hit dice, hit die, resource, concentration — exports: draft
- `src/features/homebrew/HomebrewPackageCreator.tsx` — short rest, long rest, hit die, resource — exports: HomebrewPackageCreator, addMarketplaceSource, applyMarketplaceUpdate, downloadJson, importPackage, importRevocations, restoreQuarantine, rollbackSnapshot, runAutomaticSync, runSecurityScan, savePackage, stageEntity, syncMarketplaceSource, toggleMarketplaceSource, update
- `src/core/character/character.types.ts` — resource, exhaustion, concentration — exports: none detected
- `src/core/character/characterIntegrity.ts` — spell slot, exhaustion, death save — exports: auditCharacterIntegrity
- `src/core/homebrew/homebrewContentRuntimeIntegration.test.ts` — resource, exhaustion, concentration — exports: none detected
- `src/core/rulesets/advancedFeatRuntimeRules.ts` — long rest, concentration, temporary hp — exports: getAdvancedFeatRuntime, getInspiringLeaderTempHp
- `src/core/rulesets/characterSheetCertification.test.ts` — resource, exhaustion, concentration — exports: none detected
- `src/core/rulesets/classFeatureEngine.ts` — short rest, spell slot, resource — exports: getClassFeatureActions, getClassResources, mergeClassResources
- `src/core/rulesets/classFeatureRuntime.test.ts` — resource, exhaustion, concentration — exports: none detected
