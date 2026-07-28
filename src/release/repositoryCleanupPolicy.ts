export type CleanupBucket = "keep" | "archive-script" | "archive-doc" | "archive-manifest";

const KEEP_FILES = new Set([
  "README.md", "CI.md", "TESTING.md", "DEPLOYMENT.md", "RELEASES.md",
  "SRD_ATTRIBUTION.md", "LICENSE", "package.json", "package-lock.json",
  "vite.config.ts", "playwright.config.ts", "tsconfig.json", "tsconfig.app.json",
  "tsconfig.node.json", "index.html",
]);

export function classifyRootArtifact(fileName: string): CleanupBucket {
  if (KEEP_FILES.has(fileName)) return "keep";
  if (/^APPLY_.+\.ps1$/i.test(fileName)) return "archive-script";
  if (/^(manifest|PACKAGE_MANIFEST|release-artifact-checksums).+\.json$/i.test(fileName)) return "archive-manifest";
  if (/\.(md|csv|txt)$/i.test(fileName) && /(v5\.|CERTIFICATION|HOTFIX|MATRIX|REPORT|MEGA|READINESS|FIX|UYGULAMA_ADIMLARI|DEGISTIRILEN_DOSYALAR)/i.test(fileName)) {
    return "archive-doc";
  }
  return "keep";
}
