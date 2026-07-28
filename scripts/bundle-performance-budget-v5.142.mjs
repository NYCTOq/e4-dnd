import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_BUDGETS = Object.freeze({
  maxSingleJsBytes: 400 * 1024,
  maxEntryJsBytes: 200 * 1024,
  maxCssBytes: 220 * 1024,
  maxTotalPrecacheBytes: 2500 * 1024,
});

function walkFiles(root) {
  const result = [];
  if (!fs.existsSync(root)) return result;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(full));
    else result.push(full);
  }
  return result;
}

function toAsset(root, file) {
  const stat = fs.statSync(file);
  return {
    file: path.relative(root, file).replaceAll("\\", "/"),
    bytes: stat.size,
    kib: Number((stat.size / 1024).toFixed(2)),
  };
}

export function analyzeDist(distDir, budgets = DEFAULT_BUDGETS) {
  const files = walkFiles(distDir);
  const assets = files.map((file) => toAsset(distDir, file));
  const js = assets.filter((asset) => asset.file.endsWith(".js") && !asset.file.endsWith("sw.js"));
  const css = assets.filter((asset) => asset.file.endsWith(".css"));
  const entry = js.filter((asset) => /(^|\/)index-[^/]+\.js$/.test(asset.file));
  const shell = js.filter((asset) => /(^|\/)shell-[^/]+\.js$/.test(asset.file));
  const precache = assets.filter((asset) => /\.(?:js|css|html|ico|png|svg|json|webmanifest)$/.test(asset.file));
  const totalPrecacheBytes = precache.reduce((sum, asset) => sum + asset.bytes, 0);
  const largestJs = [...js].sort((a, b) => b.bytes - a.bytes)[0] ?? null;
  const largestCss = [...css].sort((a, b) => b.bytes - a.bytes)[0] ?? null;
  const violations = [];

  if (largestJs && largestJs.bytes > budgets.maxSingleJsBytes) {
    violations.push(`Largest JS asset ${largestJs.file} is ${largestJs.kib} KiB; budget is ${(budgets.maxSingleJsBytes / 1024).toFixed(0)} KiB.`);
  }
  for (const asset of entry) {
    if (asset.bytes > budgets.maxEntryJsBytes) {
      violations.push(`Entry asset ${asset.file} is ${asset.kib} KiB; budget is ${(budgets.maxEntryJsBytes / 1024).toFixed(0)} KiB.`);
    }
  }
  if (largestCss && largestCss.bytes > budgets.maxCssBytes) {
    violations.push(`CSS asset ${largestCss.file} is ${largestCss.kib} KiB; budget is ${(budgets.maxCssBytes / 1024).toFixed(0)} KiB.`);
  }
  if (totalPrecacheBytes > budgets.maxTotalPrecacheBytes) {
    violations.push(`Precache footprint is ${(totalPrecacheBytes / 1024).toFixed(2)} KiB; budget is ${(budgets.maxTotalPrecacheBytes / 1024).toFixed(0)} KiB.`);
  }
  if (shell.length > 0) {
    violations.push(`Legacy forced shell chunk still exists: ${shell.map((asset) => asset.file).join(", ")}.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    budgets,
    summary: {
      jsAssetCount: js.length,
      cssAssetCount: css.length,
      totalJsBytes: js.reduce((sum, asset) => sum + asset.bytes, 0),
      totalCssBytes: css.reduce((sum, asset) => sum + asset.bytes, 0),
      totalPrecacheBytes,
      largestJs,
      largestCss,
      entryAssets: entry,
    },
    largestAssets: [...js, ...css].sort((a, b) => b.bytes - a.bytes).slice(0, 15),
    violations,
    passed: violations.length === 0,
  };
}

export function renderMarkdown(report) {
  const kib = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;
  const rows = report.largestAssets.map((asset) => `| ${asset.file} | ${asset.kib.toFixed(2)} |`).join("\n");
  const violationText = report.violations.length
    ? report.violations.map((item) => `- ${item}`).join("\n")
    : "- None";
  return `# Performance & Bundle Budget v5.142\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n| Metric | Value |\n|---|---:|\n| JS assets | ${report.summary.jsAssetCount} |\n| Total JS | ${kib(report.summary.totalJsBytes)} |\n| Total CSS | ${kib(report.summary.totalCssBytes)} |\n| PWA precache footprint | ${kib(report.summary.totalPrecacheBytes)} |\n| Largest JS | ${report.summary.largestJs ? `${report.summary.largestJs.file} (${report.summary.largestJs.kib.toFixed(2)} KiB)` : "None"} |\n| Largest CSS | ${report.summary.largestCss ? `${report.summary.largestCss.file} (${report.summary.largestCss.kib.toFixed(2)} KiB)` : "None"} |\n\n## Largest assets\n\n| Asset | KiB |\n|---|---:|\n${rows || "| None | 0 |"}\n\n## Budget violations\n\n${violationText}\n\n## Result\n\n**${report.passed ? "PASS" : "BLOCKED"}**\n`;
}

function runCli() {
  const root = process.cwd();
  const distDir = path.join(root, "dist");
  if (!fs.existsSync(distDir)) {
    console.error("dist directory does not exist. Run the production build first.");
    process.exit(1);
  }
  const report = analyzeDist(distDir);
  const reportsDir = path.join(root, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, "PERFORMANCE_BUNDLE_OPTIMIZATION_v5.142.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "PERFORMANCE_BUNDLE_OPTIMIZATION_v5.142.md"), renderMarkdown(report), "utf8");
  console.log(`Largest JS: ${report.summary.largestJs?.file ?? "none"} (${report.summary.largestJs?.kib ?? 0} KiB)`);
  console.log(`PWA precache footprint: ${(report.summary.totalPrecacheBytes / 1024).toFixed(2)} KiB`);
  console.log(`Bundle budget: ${report.passed ? "PASS" : "BLOCKED"}`);
  if (!report.passed) {
    for (const violation of report.violations) console.error(`- ${violation}`);
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
