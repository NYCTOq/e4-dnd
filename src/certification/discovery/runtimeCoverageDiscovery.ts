import type {
  RuntimeCategory,
  RuntimeCoverageCertification,
  RuntimeTier,
} from "../../core/rulesets/runtimeCoverageCertification";

export type RuntimeCoverageDiscoveryCategory = {
  id: Exclude<RuntimeCategory["id"], "classes">;
  total: number;
  automatic: number;
  assisted: number;
  manual: number;
  missing: number;
  score: number;
};

export type RuntimeCoverageDiscoveryReport = {
  package: "v5.119A";
  version: string;
  status: "READY_FOR_CLOSURE" | "BLOCKED";
  editions: readonly ["dnd_2014", "dnd_2024"];
  categories: RuntimeCoverageDiscoveryCategory[];
  totals: Record<RuntimeTier | "entities", number>;
  blockers: string[];
  reviewQueue: string[];
  nextPackage: "v5.119B";
  nextTarget: "Runtime Differential and Missing Behavior Closure";
};

const IDS: readonly RuntimeCoverageDiscoveryCategory["id"][] = [
  "subclasses",
  "feats",
  "spells",
  "items",
];

export function buildRuntimeCoverageDiscovery(
  reports: readonly RuntimeCoverageCertification[],
  version = "5.119.0",
): RuntimeCoverageDiscoveryReport {
  const categories = IDS.map((id) => {
    const groups = reports.map((report) => report.categories.find((group) => group.id === id));
    const sum = (key: "total" | RuntimeTier) => groups.reduce((total, group) => total + (group?.[key] ?? 0), 0);
    const total = sum("total");
    const automatic = sum("automatic");
    const assisted = sum("assisted");
    const manual = sum("manual");
    const missing = sum("missing");
    const score = total ? Math.round((automatic + assisted * 0.65 + manual * 0.25) / total * 100) : 0;
    return { id, total, automatic, assisted, manual, missing, score };
  });

  const entities = reports.flatMap((report) =>
    report.categories
      .filter((group) => IDS.includes(group.id as RuntimeCoverageDiscoveryCategory["id"]))
      .flatMap((group) => group.entities.map((entity) => ({ ...entity, category: group.label }))),
  );
  const count = (tier: RuntimeTier) => entities.filter((entity) => entity.tier === tier).length;
  const blockers = entities
    .filter((entity) => entity.tier === "missing")
    .map((entity) => `${entity.category} · ${entity.name}: ${entity.reason}`);
  const reviewQueue = entities
    .filter((entity) => entity.tier === "manual" || entity.tier === "assisted")
    .map((entity) => `${entity.category} · ${entity.name}: ${entity.tier}`)
    .slice(0, 100);

  return {
    package: "v5.119A",
    version,
    status: reports.length === 2 && categories.every((category) => category.total > 0)
      ? "READY_FOR_CLOSURE"
      : "BLOCKED",
    editions: ["dnd_2014", "dnd_2024"],
    categories,
    totals: {
      entities: entities.length,
      automatic: count("automatic"),
      assisted: count("assisted"),
      manual: count("manual"),
      missing: count("missing"),
    },
    blockers,
    reviewQueue,
    nextPackage: "v5.119B",
    nextTarget: "Runtime Differential and Missing Behavior Closure",
  };
}
