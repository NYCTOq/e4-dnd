export type FeatureRecovery = "short-rest" | "long-rest" | "dawn" | "manual";
export type FeatureEconomy = "action" | "bonus-action" | "reaction" | "passive" | "other";

export type GuidedFeatureDefinition = {
  id: string;
  name: string;
  source: string;
  maxUses: number;
  recovery: FeatureRecovery;
  economy: FeatureEconomy;
  notes?: string;
};

export type GuidedFeatureState = GuidedFeatureDefinition & {
  used: number;
  active: boolean;
  lastUsedAt?: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(value)));
const storageKey = (characterId: string) => `e4-guided-feature-runtime:${characterId}`;

export function normalizeGuidedFeature(feature: GuidedFeatureState): GuidedFeatureState {
  const maxUses = Math.max(0, Math.trunc(feature.maxUses));
  return { ...feature, maxUses, used: clamp(feature.used, 0, maxUses), active: Boolean(feature.active) };
}

export function addGuidedFeature(current: GuidedFeatureState[], definition: GuidedFeatureDefinition): GuidedFeatureState[] {
  const id = definition.id.trim();
  const name = definition.name.trim();
  if (!id || !name || current.some((item) => item.id === id)) return current;
  return [...current, normalizeGuidedFeature({ ...definition, id, name, source: definition.source.trim() || "Custom", used: 0, active: false })];
}

export function spendGuidedFeatureUse(current: GuidedFeatureState[], id: string, amount = 1): GuidedFeatureState[] {
  const cost = Math.max(1, Math.trunc(amount));
  return current.map((feature) => feature.id !== id || feature.maxUses === 0 || feature.used + cost > feature.maxUses
    ? feature
    : { ...feature, used: feature.used + cost, lastUsedAt: new Date().toISOString() });
}

export function recoverGuidedFeatures(current: GuidedFeatureState[], recovery: FeatureRecovery | "all"): GuidedFeatureState[] {
  return current.map((feature) => recovery === "all" || feature.recovery === recovery ? { ...feature, used: 0 } : feature);
}

export function toggleGuidedFeature(current: GuidedFeatureState[], id: string): GuidedFeatureState[] {
  return current.map((feature) => feature.id === id ? { ...feature, active: !feature.active } : feature);
}

export function removeGuidedFeature(current: GuidedFeatureState[], id: string): GuidedFeatureState[] {
  return current.filter((feature) => feature.id !== id);
}

export function loadGuidedFeatures(characterId: string): GuidedFeatureState[] {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.map(normalizeGuidedFeature) : [];
  } catch { return []; }
}

export function saveGuidedFeatures(characterId: string, features: GuidedFeatureState[]): void {
  localStorage.setItem(storageKey(characterId), JSON.stringify(features.map(normalizeGuidedFeature)));
}
