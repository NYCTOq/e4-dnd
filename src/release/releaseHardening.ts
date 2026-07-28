export const RELEASE_HARDENING_LIMITS = {
  maxEntryChunkBytes: 450_000,
  maxPrecacheBytes: 2_600_000,
} as const;

export const RELEASE_GATE_STEPS = [
  "unit",
  "build",
  "artifact-audit",
  "critical-e2e",
] as const;
