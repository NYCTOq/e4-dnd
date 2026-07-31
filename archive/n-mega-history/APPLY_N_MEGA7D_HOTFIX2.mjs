import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const runtimePath = path.join(ROOT, 'src/core/rulesets/spellOngoingEffectRuntime.ts');
const testPath = path.join(ROOT, 'src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts');
const panelPath = path.join(ROOT, 'src/components/spells/SpellCastingRuntimePanel.tsx');

for (const file of [runtimePath, testPath, panelPath]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

let runtime = fs.readFileSync(runtimePath, 'utf8');
runtime = runtime
  .replace('): T {\n  const targetCount', '): T & OngoingEffectCharacter {\n  const targetCount')
  .replace('): { character: T; succeeded: boolean; ended: boolean } {', '): { character: T & OngoingEffectCharacter; succeeded: boolean; ended: boolean } {')
  .replace('return { character: { ...character, ongoingSpellEffects: nextEffects } as T, succeeded, ended };', 'return { character: { ...character, ongoingSpellEffects: nextEffects } as T & OngoingEffectCharacter, succeeded, ended };')
  .replace('export function advanceOngoingSpellEffects<T extends OngoingEffectCharacter>(character: T): T {', 'export function advanceOngoingSpellEffects<T extends OngoingEffectCharacter>(character: T): T & OngoingEffectCharacter {')
  .replace('export function endOngoingSpellEffect<T extends OngoingEffectCharacter>(character: T, effectId: string): T {', 'export function endOngoingSpellEffect<T extends OngoingEffectCharacter>(character: T, effectId: string): T & OngoingEffectCharacter {');
fs.writeFileSync(runtimePath, runtime);

let panel = fs.readFileSync(panelPath, 'utf8');
panel = panel.replace(
  'import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect } from "../../core/rulesets/spellOngoingEffectRuntime";',
  'import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect, type OngoingEffectCharacter, type OngoingSpellEffect } from "../../core/rulesets/spellOngoingEffectRuntime";'
);
panel = panel
  .replaceAll('T extends SpellCompatibleCharacter>', 'T extends SpellCompatibleCharacter & OngoingEffectCharacter>')
  .replace('repeatSaveAbility: selectedSpell.saveAbility,', 'repeatSaveAbility: typeof selectedSpell.saveAbility === "string" ? selectedSpell.saveAbility : undefined,')
  .replace('(character.ongoingSpellEffects ?? []).length', '((character.ongoingSpellEffects ?? []) as OngoingSpellEffect[]).length')
  .replace('(character.ongoingSpellEffects ?? []).map((effect) =>', '((character.ongoingSpellEffects ?? []) as OngoingSpellEffect[]).map((effect: OngoingSpellEffect) =>')
  .replaceAll('.filter((target) => target.active)', '.filter((target: OngoingSpellEffect["targets"][number]) => target.active)')
  .replaceAll('.some((target) => target.active)', '.some((target: OngoingSpellEffect["targets"][number]) => target.active)')
  .replaceAll('.find((entry) => entry.active)', '.find((entry: OngoingSpellEffect["targets"][number]) => entry.active)');
fs.writeFileSync(panelPath, panel);

let test = fs.readFileSync(testPath, 'utf8');
test = test.replace(
  'import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect } from "./spellOngoingEffectRuntime";',
  'import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect, type OngoingEffectCharacter } from "./spellOngoingEffectRuntime";'
);
test = test.replaceAll('startOngoingSpellEffect({},', 'startOngoingSpellEffect({} as OngoingEffectCharacter,');
fs.writeFileSync(testPath, test);

console.log('N-MEGA7D TypeScript contracts fixed.');
