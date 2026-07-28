import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("v5.136 release candidate wiring", () => {
  it("keeps all CSS imports before declarations", () => {
    const css = fs.readFileSync(path.resolve("src/index.css"), "utf8");
    const lines = css.split(/\r?\n/);
    const firstDeclaration = lines.findIndex((line) => line.trim() && !line.trim().startsWith("@import"));
    const lateImport = lines.findIndex((line, index) => index > firstDeclaration && line.trim().startsWith("@import"));
    expect(lateImport).toBe(-1);
  });

  it("ships the release candidate runner", () => {
    expect(fs.existsSync(path.resolve("scripts/run-full-regression-rc-v5.136.mjs"))).toBe(true);
  });
});
