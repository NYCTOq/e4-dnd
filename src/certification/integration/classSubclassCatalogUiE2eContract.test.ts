import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const classPage = readFileSync(new URL("../../features/classes/ClassCatalogPage.tsx", import.meta.url), "utf8");
const subclassPage = readFileSync(new URL("../../features/subclasses/SubclassCatalogPage.tsx", import.meta.url), "utf8");
const e2e = readFileSync(new URL("../../../e2e/class-subclass-catalog-ui-v5.120D.spec.ts", import.meta.url), "utf8");

describe("v5.120D class/subclass catalog UI E2E contract", () => {
  it("publishes stable class catalog and progression hooks", () => {
    for (const token of [
      'data-testid="class-catalog"', "class-catalog-option-${item.id}",
      'data-testid="class-catalog-detail"', "class-level-${row.level}",
    ]) expect(classPage).toContain(token);
  });

  it("publishes accessible subclass filters and native detail controls", () => {
    for (const token of [
      'data-testid="subclass-catalog"', 'data-testid="subclass-class-filter"',
      "subclass-summary-${s.id}", "subclass-details-${s.id}", "<details",
    ]) expect(subclassPage).toContain(token);
  });

  it("requires physical pointer, keyboard, interception and overflow coverage", () => {
    expect(e2e).toContain(".click()");
    expect(e2e).toContain('keyboard.press("Enter")');
    expect(e2e).toContain("elementFromPoint");
    expect(e2e).toContain("scrollWidth");
    expect(e2e).toContain("desktop-chromium");
    expect(e2e).toContain("mobile-chromium");
    expect(e2e).not.toContain(".evaluate((element)");
  });
});

