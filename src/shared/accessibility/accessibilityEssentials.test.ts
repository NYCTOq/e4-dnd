import { describe, expect, it } from "vitest";
import { ACCESSIBILITY_SHORTCUTS } from "./AccessibilityHelpDialog";

describe("v5.127 accessibility essentials", () => {
  it("publishes the four essential keyboard routes", () => {
    expect(ACCESSIBILITY_SHORTCUTS.map((item) => item.keys)).toEqual(["Alt + 0", "Ctrl + K", "Shift + ?", "Escape"]);
  });

  it("keeps shortcut keys and labels unique", () => {
    expect(new Set(ACCESSIBILITY_SHORTCUTS.map((item) => item.keys)).size).toBe(ACCESSIBILITY_SHORTCUTS.length);
    expect(new Set(ACCESSIBILITY_SHORTCUTS.map((item) => item.label)).size).toBe(ACCESSIBILITY_SHORTCUTS.length);
  });
});
