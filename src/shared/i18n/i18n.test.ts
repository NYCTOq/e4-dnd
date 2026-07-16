import { describe, expect, it } from "vitest";
import { getIntlLocale, translate } from "./i18n";
import { DEFAULT_APP_SETTINGS, sanitizeAppSettings } from "../settings/appSettings";

describe("interface localization", () => {
  it("keeps Turkish as the default and migrates old settings", () => expect(sanitizeAppSettings({ ...DEFAULT_APP_SETTINGS, locale: undefined }).locale).toBe("tr"));
  it("accepts English while rejecting unknown locales", () => {
    expect(sanitizeAppSettings({ ...DEFAULT_APP_SETTINGS, locale: "en" }).locale).toBe("en");
    expect(sanitizeAppSettings({ ...DEFAULT_APP_SETTINGS, locale: "xx" }).locale).toBe("tr");
  });
  it("translates, interpolates and falls back safely", () => {
    expect(translate("en", "dashboard.continue", "fallback", { name: "Nika" })).toBe("Continue with Nika");
    expect(translate("en", "missing.key", "Güvenli fallback")).toBe("Güvenli fallback");
    expect(translate("tr", "dashboard.title", "Masa hazır.")).toBe("Masa hazır.");
  });
  it("maps locales for date and number formatting", () => expect([getIntlLocale("tr"), getIntlLocale("en")]).toEqual(["tr-TR", "en-US"]));
});
