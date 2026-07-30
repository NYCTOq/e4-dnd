import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const runtimePath = path.join(ROOT, 'src/core/rulesets/spellOngoingEffectRuntime.ts');
const testPath = path.join(ROOT, 'src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts');
const panelPath = path.join(ROOT, 'src/components/spells/SpellCastingRuntimePanel.tsx');

function requireFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}
function replaceOnce(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`Patch anchor not found (${label})`);
  return source.replace(anchor, replacement);
}

requireFile(panelPath);

const runtime = `export type OngoingSpellEffect = {
  id: string;
  spellId: string;
  spellName: string;
  castLevel: number;
  remainingRounds: number | null;
  concentration: boolean;
  repeatSaveAbility?: string;
  saveDc?: number;
  endOnSuccessfulSave: boolean;
  targets: Array<{
    id: string;
    label: string;
    active: boolean;
    successfulSaves: number;
    failedSaves: number;
  }>;
};

export type OngoingEffectCharacter = {
  ongoingSpellEffects?: OngoingSpellEffect[];
  concentrating?: boolean;
  concentrationSpellId?: string | null;
  [key: string]: unknown;
};

const cleanRounds = (rounds: number | null | undefined) =>
  rounds === null || rounds === undefined ? null : Math.max(1, Math.floor(rounds));

export function startOngoingSpellEffect<T extends OngoingEffectCharacter>(
  character: T,
  input: {
    spellId: string;
    spellName?: string;
    castLevel: number;
    durationRounds?: number | null;
    concentration?: boolean;
    repeatSaveAbility?: string;
    saveDc?: number;
    endOnSuccessfulSave?: boolean;
    targetCount?: number;
  },
): T {
  const targetCount = Math.max(1, Math.min(50, Math.floor(input.targetCount ?? 1)));
  const effect: OngoingSpellEffect = {
    id: input.spellId + '-' + Date.now().toString(36),
    spellId: input.spellId,
    spellName: input.spellName ?? input.spellId,
    castLevel: Math.max(0, Math.floor(input.castLevel)),
    remainingRounds: cleanRounds(input.durationRounds),
    concentration: Boolean(input.concentration),
    repeatSaveAbility: input.repeatSaveAbility,
    saveDc: typeof input.saveDc === 'number' ? Math.floor(input.saveDc) : undefined,
    endOnSuccessfulSave: input.endOnSuccessfulSave !== false,
    targets: Array.from({ length: targetCount }, (_, index) => ({
      id: 'target-' + (index + 1),
      label: 'Hedef ' + (index + 1),
      active: true,
      successfulSaves: 0,
      failedSaves: 0,
    })),
  };

  const existing = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const withoutReplacedConcentration = effect.concentration
    ? existing.filter((entry) => !entry.concentration)
    : existing;

  return {
    ...character,
    ongoingSpellEffects: [...withoutReplacedConcentration, effect],
    concentrating: effect.concentration ? true : character.concentrating,
    concentrationSpellId: effect.concentration ? effect.spellId : character.concentrationSpellId,
  };
}

export function resolveOngoingEffectSave<T extends OngoingEffectCharacter>(
  character: T,
  effectId: string,
  targetId: string,
  saveTotal: number,
): { character: T; succeeded: boolean; ended: boolean } {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  let succeeded = false;
  let ended = false;
  const nextEffects = effects.map((effect) => {
    if (effect.id !== effectId) return effect;
    const dc = effect.saveDc ?? 0;
    succeeded = Math.floor(saveTotal) >= dc;
    const targets = effect.targets.map((target) => {
      if (target.id !== targetId || !target.active) return target;
      const active = succeeded && effect.endOnSuccessfulSave ? false : target.active;
      ended = !active;
      return {
        ...target,
        active,
        successfulSaves: target.successfulSaves + (succeeded ? 1 : 0),
        failedSaves: target.failedSaves + (succeeded ? 0 : 1),
      };
    });
    return { ...effect, targets };
  });
  return { character: { ...character, ongoingSpellEffects: nextEffects } as T, succeeded, ended };
}

export function advanceOngoingSpellEffects<T extends OngoingEffectCharacter>(character: T): T {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const next = effects
    .map((effect) => ({
      ...effect,
      remainingRounds: effect.remainingRounds === null ? null : Math.max(0, effect.remainingRounds - 1),
    }))
    .filter((effect) => effect.remainingRounds === null || effect.remainingRounds > 0)
    .filter((effect) => effect.targets.some((target) => target.active));
  const concentrationStillActive = next.some((effect) => effect.concentration);
  return {
    ...character,
    ongoingSpellEffects: next,
    concentrating: concentrationStillActive ? true : character.concentrating && !effects.some((effect) => effect.concentration),
    concentrationSpellId: concentrationStillActive
      ? next.find((effect) => effect.concentration)?.spellId ?? null
      : effects.some((effect) => effect.concentration) ? null : character.concentrationSpellId,
  };
}

export function endOngoingSpellEffect<T extends OngoingEffectCharacter>(character: T, effectId: string): T {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const removed = effects.find((effect) => effect.id === effectId);
  const next = effects.filter((effect) => effect.id !== effectId);
  return {
    ...character,
    ongoingSpellEffects: next,
    concentrating: removed?.concentration ? false : character.concentrating,
    concentrationSpellId: removed?.concentration ? null : character.concentrationSpellId,
  };
}
`;

const test = `import { describe, expect, it } from "vitest";
import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect } from "./spellOngoingEffectRuntime";

describe("N-MEGA7D ongoing spell effects", () => {
  it("starts and persists a concentration effect with targets", () => {
    const character = startOngoingSpellEffect({}, { spellId: "hold-person", castLevel: 2, concentration: true, durationRounds: 10, repeatSaveAbility: "wisdom", saveDc: 15, targetCount: 2 });
    expect(character.concentrating).toBe(true);
    expect(character.ongoingSpellEffects?.[0].targets).toHaveLength(2);
  });

  it("ends a target on a successful repeat save", () => {
    const started = startOngoingSpellEffect({}, { spellId: "hold-person", castLevel: 2, repeatSaveAbility: "wisdom", saveDc: 15 });
    const effect = started.ongoingSpellEffects![0];
    const result = resolveOngoingEffectSave(started, effect.id, effect.targets[0].id, 15);
    expect(result.succeeded).toBe(true);
    expect(result.ended).toBe(true);
    expect(result.character.ongoingSpellEffects?.[0].targets[0].active).toBe(false);
  });

  it("keeps a target active after a failed save", () => {
    const started = startOngoingSpellEffect({}, { spellId: "hold-person", castLevel: 2, saveDc: 15 });
    const effect = started.ongoingSpellEffects![0];
    const result = resolveOngoingEffectSave(started, effect.id, effect.targets[0].id, 14);
    expect(result.succeeded).toBe(false);
    expect(result.character.ongoingSpellEffects?.[0].targets[0].active).toBe(true);
  });

  it("expires timed effects and clears concentration", () => {
    const started = startOngoingSpellEffect({}, { spellId: "fog", castLevel: 1, concentration: true, durationRounds: 1 });
    const advanced = advanceOngoingSpellEffects(started);
    expect(advanced.ongoingSpellEffects).toEqual([]);
    expect(advanced.concentrating).toBe(false);
    expect(advanced.concentrationSpellId).toBeNull();
  });

  it("can end an effect manually", () => {
    const started = startOngoingSpellEffect({}, { spellId: "bless", castLevel: 1, concentration: true });
    const ended = endOngoingSpellEffect(started, started.ongoingSpellEffects![0].id);
    expect(ended.ongoingSpellEffects).toEqual([]);
    expect(ended.concentrating).toBe(false);
  });
});
`;

fs.writeFileSync(runtimePath, runtime);
fs.writeFileSync(testPath, test);

let panel = fs.readFileSync(panelPath, 'utf8');
if (!panel.includes('spell-runtime-ongoing-effects')) {
  panel = replaceOnce(
    panel,
    'import type { SpellDamageRelation } from "../../core/rulesets/spellRuntimeCombatRules";',
    'import type { SpellDamageRelation } from "../../core/rulesets/spellRuntimeCombatRules";\nimport { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect } from "../../core/rulesets/spellOngoingEffectRuntime";',
    'ongoing imports',
  );
  panel = replaceOnce(
    panel,
    '  const [targetDamageRelation, setTargetDamageRelation] = useState<SpellDamageRelation>("normal");',
    '  const [targetDamageRelation, setTargetDamageRelation] = useState<SpellDamageRelation>("normal");\n  const [ongoingDurationRounds, setOngoingDurationRounds] = useState(10);\n  const [ongoingSaveTotal, setOngoingSaveTotal] = useState(10);',
    'ongoing state',
  );
  panel = replaceOnce(
    panel,
    '  const mutateSlot = (level: number, mode: "spend" | "restore", pact = false) => {',
    `  const startSelectedOngoingEffect = () => {\n    if (!selectedSpell) { setFeedback("Sürdürülecek büyüyü seç."); return; }\n    const next = startOngoingSpellEffect(character, { spellId: String(selectedSpell.id), spellName: String(selectedSpell.name ?? selectedSpell.id), castLevel, durationRounds: ongoingDurationRounds, concentration: Boolean(selectedSpell.concentration), repeatSaveAbility: selectedSpell.saveAbility, saveDc: snapshot.spellSaveDc, targetCount });\n    onCharacterChange(next as T);\n    setFeedback(String(selectedSpell.name ?? selectedSpell.id) + " devam eden etki olarak başlatıldı.");\n  };\n\n  const mutateSlot = (level: number, mode: "spend" | "restore", pact = false) => {`,
    'ongoing handler',
  );
  const anchor = '      <div className="spell-casting-runtime-panel__rest-actions" aria-label="Büyü slotu dinlenme kontrolleri">';
  const ongoingUi = `      <section className="spell-casting-runtime-panel__ongoing" data-testid="spell-runtime-ongoing-effects">\n        <h3>Devam Eden Büyü Etkileri</h3>\n        <div>\n          <label>Süre (tur) <input type="number" min="1" value={ongoingDurationRounds} onChange={(event) => setOngoingDurationRounds(Math.max(1, Number(event.target.value) || 1))} data-testid="spell-runtime-ongoing-duration" /></label>\n          <button type="button" onClick={startSelectedOngoingEffect} disabled={!selectedSpell} data-testid="spell-runtime-start-ongoing">Etkiyi Başlat</button>\n          <button type="button" onClick={() => { onCharacterChange(advanceOngoingSpellEffects(character) as T); setFeedback("Devam eden büyü etkileri bir tur ilerletildi."); }} data-testid="spell-runtime-advance-effects">Turu İlerlet</button>\n        </div>\n        {(character.ongoingSpellEffects ?? []).length === 0 ? <p>Devam eden büyü etkisi yok.</p> : (character.ongoingSpellEffects ?? []).map((effect) => (\n          <article key={effect.id} data-testid={\`spell-runtime-effect-\${effect.id}\`}>\n            <strong>{effect.spellName}</strong>\n            <span>{effect.remainingRounds === null ? "Süresiz" : effect.remainingRounds + " tur"}</span>\n            <span>{effect.targets.filter((target) => target.active).length}/{effect.targets.length} aktif hedef</span>\n            <label>Tekrar save <input type="number" value={ongoingSaveTotal} onChange={(event) => setOngoingSaveTotal(Number(event.target.value) || 0)} /></label>\n            <button type="button" disabled={!effect.targets.some((target) => target.active)} onClick={() => { const target = effect.targets.find((entry) => entry.active); if (!target) return; const result = resolveOngoingEffectSave(character, effect.id, target.id, ongoingSaveTotal); onCharacterChange(result.character as T); setFeedback(result.succeeded ? target.label + " save başarılı." : target.label + " save başarısız."); }}>Aktif Hedefe Save</button>\n            <button type="button" onClick={() => { onCharacterChange(endOngoingSpellEffect(character, effect.id) as T); setFeedback(effect.spellName + " etkisi sona erdi."); }}>Bitir</button>\n          </article>\n        ))}\n      </section>\n\n` + anchor;
  panel = replaceOnce(panel, anchor, ongoingUi, 'ongoing UI');
  fs.writeFileSync(panelPath, panel);
}

console.log('N-MEGA7D ongoing spell effect runtime applied.');
