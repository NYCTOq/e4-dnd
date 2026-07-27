import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const reportDir = resolve(process.cwd(), "reports/certification");
await mkdir(reportDir, { recursive:true });

const report = {
  generatedAt: new Date().toISOString(),
  package: "v5.106 Mega Certification Expansion",
  certifiedDomains: [
    "2014 core ancestry catalog",
    "2024 core species catalog",
    "12 class hit dice and save metadata",
    "level 1-20 proficiency bonus",
    "level 1-20 average HP oracle",
    "2014/2024 subclass unlock levels",
    "full caster spell slot progression",
    "100+ deterministic pairwise scenarios",
    "desktop and mobile ancestry selection smoke tests",
  ],
  commands: {
    quick: "npm run certify:mega:quick",
    ancestry: "npm run certify:ancestry:all",
    release: "npm run certify:mega:release",
  },
};

await writeFile(
  resolve(reportDir, "mega-certification-v5.106.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const markdown = `# Mega Certification v5.106

Generated: ${report.generatedAt}

## Certified domains

${report.certifiedDomains.map((item) => `- ${item}`).join("\n")}

## Commands

- Quick: \`${report.commands.quick}\`
- All ancestry E2E: \`${report.commands.ancestry}\`
- Full release: \`${report.commands.release}\`
`;

await writeFile(
  resolve(reportDir, "mega-certification-v5.106.md"),
  markdown,
  "utf8",
);

console.log("Mega certification report generated.");
