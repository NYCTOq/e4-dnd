import { describe, expect, it } from "vitest";
import { buildUiMobileAccessibilityAudit, DEFAULT_UI_POLISH_EVIDENCE } from "./uiMobileAccessibilityPolish";

describe("UI, mobile and accessibility polish", () => {
  it("certifies the default polish evidence", () => expect(buildUiMobileAccessibilityAudit(DEFAULT_UI_POLISH_EVIDENCE)).toMatchObject({ready:true,score:100,blockers:[]}));
  it("blocks undersized touch targets", () => expect(buildUiMobileAccessibilityAudit({...DEFAULT_UI_POLISH_EVIDENCE,touchTargetMinPx:40}).blockers[0].id).toBe("touch-targets"));
  it("blocks a missing dialog focus trap", () => expect(buildUiMobileAccessibilityAudit({...DEFAULT_UI_POLISH_EVIDENCE,focusTrapDialogs:["release-notes"]}).blockers.some(item=>item.id==="dialog-focus")).toBe(true));
  it("blocks missing compact breakpoints", () => expect(buildUiMobileAccessibilityAudit({...DEFAULT_UI_POLISH_EVIDENCE,responsiveBreakpoints:[1200,900]}).ready).toBe(false));
  it("warns when reduced motion is absent", () => expect(buildUiMobileAccessibilityAudit({...DEFAULT_UI_POLISH_EVIDENCE,reducedMotion:false}).warnings[0].id).toBe("motion-and-errors"));
  it("warns when error focus evidence is absent", () => expect(buildUiMobileAccessibilityAudit({...DEFAULT_UI_POLISH_EVIDENCE,errorFocus:false}).warnings).toHaveLength(1));
});
