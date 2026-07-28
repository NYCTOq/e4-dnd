export type PublicReleaseCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

export type PublicReleaseReadiness = {
  passed: boolean;
  checks: PublicReleaseCheck[];
};

export function evaluatePublicReleaseReadiness(input: {
  version: string;
  hasIndex: boolean;
  hasManifest: boolean;
  hasServiceWorker: boolean;
  hasAssets: boolean;
  hasReadme: boolean;
  hasAttribution: boolean;
  securityGatePassed: boolean;
  bundleGatePassed: boolean;
}): PublicReleaseReadiness {
  const checks: PublicReleaseCheck[] = [
    { id: "version", passed: input.version === "6.0.0", detail: `Version is ${input.version}` },
    { id: "index", passed: input.hasIndex, detail: "Production entry exists" },
    { id: "manifest", passed: input.hasManifest, detail: "PWA manifest exists" },
    { id: "service-worker", passed: input.hasServiceWorker, detail: "Service worker exists" },
    { id: "assets", passed: input.hasAssets, detail: "Production assets exist" },
    { id: "readme", passed: input.hasReadme, detail: "Release README exists" },
    { id: "attribution", passed: input.hasAttribution, detail: "SRD attribution exists" },
    { id: "security", passed: input.securityGatePassed, detail: "Context-aware production security gate passed" },
    { id: "bundle", passed: input.bundleGatePassed, detail: "Bundle budget gate passed" },
  ];
  return { passed: checks.every((check) => check.passed), checks };
}
