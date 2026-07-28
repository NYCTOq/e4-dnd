export type ReleaseInputStatus = {
  indexHtml: boolean;
  webManifest: boolean;
  serviceWorker: boolean;
  assetCount: number;
  version: string;
};

export type ReleaseValidation = {
  ok: boolean;
  violations: string[];
};

export function normalizeReleaseVersion(version: string): string {
  const normalized = version.trim().replace(/^v/i, "");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(normalized)) {
    throw new Error(`Invalid release version: ${version}`);
  }
  return normalized;
}

export function releaseFolderName(version: string): string {
  return `E4_DND_v${normalizeReleaseVersion(version)}`;
}

export function validateReleaseInputs(input: ReleaseInputStatus): ReleaseValidation {
  const violations: string[] = [];
  try {
    normalizeReleaseVersion(input.version);
  } catch (error) {
    violations.push(error instanceof Error ? error.message : "Invalid release version");
  }
  if (!input.indexHtml) violations.push("dist/index.html is missing");
  if (!input.webManifest) violations.push("dist/manifest.webmanifest is missing");
  if (!input.serviceWorker) violations.push("dist/sw.js is missing");
  if (input.assetCount < 1) violations.push("dist/assets contains no release assets");
  return { ok: violations.length === 0, violations };
}
