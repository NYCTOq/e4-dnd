import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// @ts-ignore Node ESM audit module is executed directly and intentionally has no TS declaration.
import { analyzeDist } from "../../../scripts/bundle-performance-budget-v5.142.mjs";

const roots: string[] = [];
function fixture(files: Record<string, number>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "e4-bundle-"));
  roots.push(root);
  for (const [name, size] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.alloc(size));
  }
  return root;
}

afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("v5.142 bundle performance budget", () => {
  it("passes a split build inside all budgets", () => {
    const root = fixture({
      "assets/index-a.js": 120 * 1024,
      "assets/vendor-react-a.js": 170 * 1024,
      "assets/vendor-router-a.js": 45 * 1024,
      "assets/PlayMode-a.js": 145 * 1024,
      "assets/index-a.css": 180 * 1024,
      "index.html": 1200,
    });
    expect(analyzeDist(root).passed).toBe(true);
  });

  it("blocks the legacy forced shell chunk", () => {
    const root = fixture({ "assets/shell-a.js": 200 * 1024, "assets/index-a.js": 100 * 1024 });
    const report = analyzeDist(root);
    expect(report.passed).toBe(false);
    expect(report.violations.some((item: string) => item.includes("forced shell chunk"))).toBe(true);
  });

  it("blocks an oversized entry asset", () => {
    const root = fixture({ "assets/index-a.js": 220 * 1024 });
    expect(analyzeDist(root).violations.some((item: string) => item.includes("Entry asset"))).toBe(true);
  });

  it("tracks the largest asset and precache footprint", () => {
    const root = fixture({ "assets/a.js": 40 * 1024, "assets/b.js": 80 * 1024, "assets/a.css": 20 * 1024 });
    const report = analyzeDist(root);
    expect(report.summary.largestJs?.file).toBe("assets/b.js");
    expect(report.summary.totalPrecacheBytes).toBe(140 * 1024);
  });
});
