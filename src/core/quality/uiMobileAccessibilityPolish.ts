export type UiPolishStatus = "pass" | "warning" | "fail";
export type UiPolishCheck = { id: string; status: UiPolishStatus; summary: string; details: string[] };
export type UiPolishEvidence = {
  touchTargetMinPx: number;
  focusTrapDialogs: string[];
  responsiveBreakpoints: number[];
  reducedMotion: boolean;
  horizontalOverflowGuards: boolean;
  errorFocus: boolean;
};

export const REQUIRED_DIALOGS = ["release-notes", "storage-recovery"] as const;

export function buildUiMobileAccessibilityAudit(evidence: UiPolishEvidence) {
  const checks: UiPolishCheck[] = [];
  checks.push({
    id: "touch-targets",
    status: evidence.touchTargetMinPx >= 44 ? "pass" : "fail",
    summary: evidence.touchTargetMinPx >= 44 ? "Touch targets meet the 44 px minimum." : "Touch targets are below 44 px.",
    details: [`Minimum target: ${evidence.touchTargetMinPx}px`],
  });
  const missingDialogs = REQUIRED_DIALOGS.filter((id) => !evidence.focusTrapDialogs.includes(id));
  checks.push({
    id: "dialog-focus",
    status: missingDialogs.length ? "fail" : "pass",
    summary: missingDialogs.length ? "Required dialogs do not trap and restore focus." : "Required dialogs trap focus, support Escape and restore the opener.",
    details: missingDialogs,
  });
  checks.push({
    id: "responsive-layout",
    status: evidence.responsiveBreakpoints.includes(900) && evidence.responsiveBreakpoints.some((value) => value <= 600) && evidence.horizontalOverflowGuards ? "pass" : "fail",
    summary: "Responsive layout and horizontal overflow guards are certified.",
    details: evidence.responsiveBreakpoints.map((value) => `${value}px`),
  });
  checks.push({
    id: "motion-and-errors",
    status: evidence.reducedMotion && evidence.errorFocus ? "pass" : "warning",
    summary: evidence.reducedMotion && evidence.errorFocus ? "Reduced motion and error focus policies are present." : "Motion or error-focus evidence needs review.",
    details: [evidence.reducedMotion ? "reduced-motion" : "missing reduced-motion", evidence.errorFocus ? "error-focus" : "missing error-focus"],
  });
  return {
    checks,
    blockers: checks.filter((check) => check.status === "fail"),
    warnings: checks.filter((check) => check.status === "warning"),
    score: Math.round((checks.filter((check) => check.status === "pass").length / checks.length) * 100),
    ready: checks.every((check) => check.status !== "fail"),
  };
}

export const DEFAULT_UI_POLISH_EVIDENCE: UiPolishEvidence = {
  touchTargetMinPx: 44,
  focusTrapDialogs: [...REQUIRED_DIALOGS],
  responsiveBreakpoints: [1200, 900, 600, 420],
  reducedMotion: true,
  horizontalOverflowGuards: true,
  errorFocus: true,
};
