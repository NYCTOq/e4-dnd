import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const guideSource = readFileSync(
  new URL("../../shared/pwa/PwaInstallGuide.tsx", import.meta.url),
  "utf8",
);
const guideStyles = readFileSync(
  new URL("../../styles/18-pwa-install-guide.css", import.meta.url),
  "utf8",
);
const e2eSource = readFileSync(
  new URL("../../../e2e/global-shell-overlay-safety-v5.116.spec.ts", import.meta.url),
  "utf8",
);
const overlayRuntimeSource = readFileSync(
  new URL("../../shared/layout/shellOverlayRuntime.ts", import.meta.url),
  "utf8",
);
const routeAccessibilitySource = readFileSync(
  new URL("../../shared/navigation/RouteAccessibility.tsx", import.meta.url),
  "utf8",
);
const releaseDialogSource = readFileSync(
  new URL("../../shared/release/ReleaseNotesDialog.tsx", import.meta.url),
  "utf8",
);

describe("v5.116 global shell overlay contract", () => {
  it("opens first-run guidance synchronously without a delayed pointer race", () => {
    expect(guideSource).toContain("useState(() => !guideCompleted)");
    expect(guideSource).not.toContain("setTimeout(() => setIsGuideOpen(true)");
  });

  it("persists completion before closing and supports keyboard dismissal", () => {
    expect(guideSource).toContain("writeJsonSafely(FIRST_RUN_STORAGE_KEY, true)");
    expect(guideSource).toContain('event.key === "Escape"');
    expect(guideSource).toContain('document.body.style.overflow = "hidden"');
  });

  it("keeps the modal bounded and certifies real pointer clicks", () => {
    expect(guideStyles).toContain("isolation: isolate");
    expect(guideStyles).toContain("overscroll-behavior: contain");
    expect(e2eSource).toContain(".click()");
    expect(e2eSource).not.toContain("HTMLButtonElement).click");
  });

  it("serializes onboarding before release notes", () => {
    expect(overlayRuntimeSource).toContain("hasCompletedFirstRun(storage)");
    expect(overlayRuntimeSource).toContain("LAST_SEEN_VERSION_KEY");
    expect(guideSource).toContain("FIRST_RUN_COMPLETED_EVENT");
    expect(e2eSource).toContain('getByTestId("release-notes-close").click()');
  });

  it("prevents route announcements from stealing modal focus", () => {
    expect(routeAccessibilitySource).toContain(
      'document.querySelector(\'[aria-modal="true"]\')',
    );
    expect(routeAccessibilitySource).toContain("main && !hasOpenModal");
  });

  it("portals release notes outside the mobile-hidden sidebar", () => {
    expect(releaseDialogSource).toContain('import { createPortal } from "react-dom"');
    expect(releaseDialogSource).toContain("document.body");
    expect(releaseDialogSource).toContain("isOpen ? createPortal(");
  });
});
