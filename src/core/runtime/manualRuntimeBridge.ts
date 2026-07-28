export type ManualRuntimeKind = "spell" | "feat" | "item" | "subclass" | "class" | "condition" | "other";

export type ManualRuntimeEffect = {
  id: string;
  name: string;
  kind: ManualRuntimeKind;
  note: string;
  remainingRounds: number | null;
  createdAt: string;
};

const keyFor = (characterId: string) => `e4.manual-runtime.v5.135.${characterId}`;

export function loadManualRuntimeEffects(characterId: string): ManualRuntimeEffect[] {
  try {
    const raw = localStorage.getItem(keyFor(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ManualRuntimeEffect => Boolean(item && typeof item.id === "string" && typeof item.name === "string"));
  } catch {
    return [];
  }
}

export function saveManualRuntimeEffects(characterId: string, effects: ManualRuntimeEffect[]): void {
  localStorage.setItem(keyFor(characterId), JSON.stringify(effects));
}

export function addManualRuntimeEffect(effects: ManualRuntimeEffect[], input: { name: string; kind: ManualRuntimeKind; note?: string; rounds?: number | null }): ManualRuntimeEffect[] {
  const name = input.name.trim();
  if (!name) return effects;
  return [{ id: crypto.randomUUID(), name, kind: input.kind, note: input.note?.trim() ?? "", remainingRounds: input.rounds && input.rounds > 0 ? Math.floor(input.rounds) : null, createdAt: new Date().toISOString() }, ...effects];
}

export function advanceManualRuntimeEffects(effects: ManualRuntimeEffect[]): ManualRuntimeEffect[] {
  return effects.flatMap((effect) => {
    if (effect.remainingRounds === null) return [effect];
    const remainingRounds = effect.remainingRounds - 1;
    return remainingRounds > 0 ? [{ ...effect, remainingRounds }] : [];
  });
}

export function removeManualRuntimeEffect(effects: ManualRuntimeEffect[], id: string): ManualRuntimeEffect[] {
  return effects.filter((effect) => effect.id !== id);
}
