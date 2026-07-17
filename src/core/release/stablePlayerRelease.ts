import { buildReleaseReadinessAudit } from "../quality/releaseReadinessAudit";
import {
  buildStableReleaseHardeningReport,
  type ReleaseGateInput,
  type StableReleaseHardeningReport,
} from "./stableReleaseHardening";

export const STABLE_PLAYER_RELEASE_VERSION = "5.0.0" as const;
export const STABLE_PLAYER_RELEASE_CHANNEL = "stable" as const;

export type StablePlayerReleaseInput = Omit<ReleaseGateInput, "appVersion"> & {
  appVersion?: string;
  expectedVersion?: string;
  runtimeMissingCount?: number;
  playerJourneyCertified?: boolean;
  dataIntegrityCertified?: boolean;
};

export type StablePlayerReleaseManifest = {
  product: "E4 D&D";
  version: string;
  channel: typeof STABLE_PLAYER_RELEASE_CHANNEL;
  generatedAt: string;
  stable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  guarantees: string[];
  hardening: StableReleaseHardeningReport;
};

export const STABLE_PLAYER_GUARANTEES = [
  "D&D 2014 and 2024 player rules remain edition-separated.",
  "Character creation, level-up, play, rest and backup use certified shared runtimes.",
  "Backup candidates are parsed and hydrated before restore.",
  "Migration failures and unresolved crashes block the stable release.",
  "Open rules attribution is tracked for SRD 5.1, SRD 5.2.1 and CC BY 4.0.",
] as const;

export function buildStablePlayerReleaseManifest(input: StablePlayerReleaseInput): StablePlayerReleaseManifest {
  const version = input.appVersion ?? STABLE_PLAYER_RELEASE_VERSION;
  const expectedVersion = input.expectedVersion ?? STABLE_PLAYER_RELEASE_VERSION;
  const hardening = buildStableReleaseHardeningReport({ ...input, appVersion: version });
  const audit = buildReleaseReadinessAudit();
  const blockers = [...hardening.blockers];
  const warnings = [...hardening.warnings];

  if (version !== expectedVersion) blockers.push(`Version gate: expected ${expectedVersion}, received ${version}.`);
  if (!audit.ready) blockers.push(...audit.blockers.map((check) => `${check.area}: ${check.summary}`));
  if (input.runtimeMissingCount && input.runtimeMissingCount > 0) blockers.push(`Runtime coverage: ${input.runtimeMissingCount} missing behavior(s).`);
  if (input.playerJourneyCertified === false) blockers.push("Player journey certification failed.");
  if (input.dataIntegrityCertified === false) blockers.push("Character data integrity certification failed.");
  if (input.playerJourneyCertified === undefined) warnings.push("Player journey certification result was not supplied.");
  if (input.dataIntegrityCertified === undefined) warnings.push("Character data integrity certification result was not supplied.");

  const totalGates = 5;
  const passedGates = [
    hardening.ready,
    audit.ready,
    version === expectedVersion,
    (input.runtimeMissingCount ?? 0) === 0,
    input.playerJourneyCertified !== false && input.dataIntegrityCertified !== false,
  ].filter(Boolean).length;

  return {
    product: "E4 D&D",
    version,
    channel: STABLE_PLAYER_RELEASE_CHANNEL,
    generatedAt: new Date().toISOString(),
    stable: blockers.length === 0,
    score: Math.round(((hardening.score / 100) * 60) + ((passedGates / totalGates) * 40)),
    blockers,
    warnings: [...new Set(warnings)],
    guarantees: [...STABLE_PLAYER_GUARANTEES],
    hardening,
  };
}

export function formatStablePlayerReleaseSummary(manifest: StablePlayerReleaseManifest): string {
  const state = manifest.stable ? "STABLE" : "BLOCKED";
  return `${manifest.product} v${manifest.version} [${state}] • score ${manifest.score}/100 • ${manifest.blockers.length} blocker • ${manifest.warnings.length} warning`;
}
