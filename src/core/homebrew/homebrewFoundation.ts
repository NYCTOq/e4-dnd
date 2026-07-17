import type {
  DndBackgroundData,
  DndClassData,
  DndFeatData,
  DndItemData,
  DndRaceData,
  DndSpellData,
  DndSubclassData,
} from "../rulesets/ruleset.types";

export type HomebrewEntityType =
  | "class"
  | "subclass"
  | "species"
  | "background"
  | "feat"
  | "spell"
  | "item";

export type HomebrewRecovery = "short-rest" | "long-rest" | "dawn" | "manual" | "none";

export type HomebrewResourceDefinition = {
  id: string;
  name: string;
  maximum: number;
  recovery: HomebrewRecovery;
  recoveryAmount?: number;
  levelScaling?: Array<{ level: number; maximum: number }>;
};

export type HomebrewRuntimeAction = {
  id: string;
  name: string;
  economy: "action" | "bonus-action" | "reaction" | "free" | "passive";
  resourceId?: string;
  resourceCost?: number;
  summary: string;
};

export type HomebrewEntityPayload = {
  class: DndClassData;
  subclass: DndSubclassData;
  species: DndRaceData;
  background: DndBackgroundData;
  feat: DndFeatData;
  spell: DndSpellData;
  item: DndItemData;
};

export type HomebrewEntity<T extends HomebrewEntityType = HomebrewEntityType> = {
  schemaVersion: 1;
  type: T;
  id: string;
  name: string;
  author?: string;
  description?: string;
  tags: string[];
  payload: HomebrewEntityPayload[T];
  resources?: HomebrewResourceDefinition[];
  actions?: HomebrewRuntimeAction[];
  createdAt: string;
  updatedAt: string;
};

export type HomebrewPackage = {
  format: "e4-dnd-homebrew";
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  createdAt: string;
  entities: HomebrewEntity[];
};

export type HomebrewValidationReport = {
  valid: boolean;
  blockers: string[];
  warnings: string[];
};

const ENTITY_TYPES: HomebrewEntityType[] = ["class", "subclass", "species", "background", "feat", "spell", "item"];
const RECOVERY_TYPES: HomebrewRecovery[] = ["short-rest", "long-rest", "dawn", "manual", "none"];

export function validateHomebrewEntity(entity: HomebrewEntity): HomebrewValidationReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (entity.schemaVersion !== 1) blockers.push("Desteklenmeyen homebrew entity şema sürümü.");
  if (!ENTITY_TYPES.includes(entity.type)) blockers.push("Geçersiz homebrew entity türü.");
  if (!entity.id.trim()) blockers.push("Homebrew entity ID zorunludur.");
  if (!entity.name.trim()) blockers.push("Homebrew entity adı zorunludur.");
  const payload = entity.payload as { id?: string; name?: string };
  if (!payload || typeof payload !== "object") blockers.push("Homebrew payload zorunludur.");
  if (payload?.id !== entity.id) blockers.push("Entity ID ile payload ID aynı olmalıdır.");
  if (payload?.name !== entity.name) warnings.push("Entity adı ile payload adı farklı.");
  const resourceIds = new Set<string>();
  for (const resource of entity.resources ?? []) {
    if (!resource.id.trim() || !resource.name.trim()) blockers.push("Resource ID ve adı zorunludur.");
    if (resourceIds.has(resource.id)) blockers.push(`Tekrarlanan resource ID: ${resource.id}`);
    resourceIds.add(resource.id);
    if (!Number.isFinite(resource.maximum) || resource.maximum < 0) blockers.push(`${resource.name} maksimumu geçersiz.`);
    if (!RECOVERY_TYPES.includes(resource.recovery)) blockers.push(`${resource.name} recovery türü geçersiz.`);
    if (resource.recoveryAmount !== undefined && resource.recoveryAmount < 0) blockers.push(`${resource.name} recovery miktarı geçersiz.`);
    for (const step of resource.levelScaling ?? []) {
      if (step.level < 1 || step.level > 20 || step.maximum < 0) blockers.push(`${resource.name} level scaling kaydı geçersiz.`);
    }
  }
  const actionIds = new Set<string>();
  for (const action of entity.actions ?? []) {
    if (!action.id.trim() || !action.name.trim() || !action.summary.trim()) blockers.push("Runtime action ID, ad ve özet zorunludur.");
    if (actionIds.has(action.id)) blockers.push(`Tekrarlanan action ID: ${action.id}`);
    actionIds.add(action.id);
    if (action.resourceId && !resourceIds.has(action.resourceId)) blockers.push(`${action.name} bilinmeyen resource kullanıyor: ${action.resourceId}`);
    if (action.resourceCost !== undefined && action.resourceCost < 0) blockers.push(`${action.name} resource maliyeti geçersiz.`);
  }
  if (!(entity.actions?.length || entity.resources?.length)) warnings.push("Entity için custom runtime action veya resource tanımlanmamış.");
  return { valid: blockers.length === 0, blockers, warnings };
}

export function validateHomebrewPackage(pkg: HomebrewPackage): HomebrewValidationReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (pkg.format !== "e4-dnd-homebrew") blockers.push("Geçersiz homebrew paket formatı.");
  if (pkg.schemaVersion !== 1) blockers.push("Desteklenmeyen homebrew paket şema sürümü.");
  if (!pkg.id.trim() || !pkg.name.trim() || !pkg.version.trim()) blockers.push("Paket ID, ad ve sürüm zorunludur.");
  const ids = new Set<string>();
  for (const entity of pkg.entities) {
    if (ids.has(entity.id)) blockers.push(`Tekrarlanan entity ID: ${entity.id}`);
    ids.add(entity.id);
    const report = validateHomebrewEntity(entity);
    blockers.push(...report.blockers.map((message) => `${entity.name || entity.id}: ${message}`));
    warnings.push(...report.warnings.map((message) => `${entity.name || entity.id}: ${message}`));
  }
  if (!pkg.entities.length) warnings.push("Homebrew paketi boş.");
  return { valid: blockers.length === 0, blockers, warnings };
}

export function exportHomebrewPackage(pkg: HomebrewPackage): string {
  const report = validateHomebrewPackage(pkg);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return JSON.stringify(pkg, null, 2);
}

export function importHomebrewPackage(raw: string): HomebrewPackage {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Homebrew paketi geçerli JSON değil."); }
  const pkg = parsed as HomebrewPackage;
  const report = validateHomebrewPackage(pkg);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return structuredClone(pkg);
}

export function createHomebrewPackage(input: Omit<HomebrewPackage, "format" | "schemaVersion" | "createdAt">): HomebrewPackage {
  return {
    ...input,
    format: "e4-dnd-homebrew",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    entities: structuredClone(input.entities),
  };
}

export function getHomebrewResourceMaximum(resource: HomebrewResourceDefinition, level: number): number {
  return [...(resource.levelScaling ?? [])]
    .filter((step) => step.level <= level)
    .sort((a, b) => b.level - a.level)[0]?.maximum ?? resource.maximum;
}

export function recoverHomebrewResource(
  resource: HomebrewResourceDefinition,
  used: number,
  trigger: HomebrewRecovery,
  level: number,
): number {
  const maximum = getHomebrewResourceMaximum(resource, level);
  if (resource.recovery === "none" || resource.recovery === "manual" || resource.recovery !== trigger) return Math.min(maximum, Math.max(0, used));
  const restored = resource.recoveryAmount ?? maximum;
  return Math.max(0, Math.min(maximum, used - restored));
}
