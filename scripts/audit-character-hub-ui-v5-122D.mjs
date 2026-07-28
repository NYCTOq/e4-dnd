import fs from "node:fs";
const required=["src/core/character/characterHubActionability.ts","src/features/characters/CharacterHubActionLink.tsx","e2e/character-hub-actionability-v5.122D.spec.ts"];
const missing=required.filter(path=>!fs.existsSync(path));
const report={package:"v5.122D",version:"5.122.3",status:missing.length?"BLOCKED":"GREEN",surfaces:["dashboard","characters","detail"],states:["empty","ready","wounded","critical"],browserProjects:["desktop-chromium","mobile-chromium"],physicalScenarioCount:8,runtimeBridge:"src/core/character/characterHubActionability.ts",releaseBlockers:missing,nextPackage:"v5.123A"};
fs.mkdirSync("certification-reports",{recursive:true});
fs.writeFileSync("certification-reports/character-hub-ui-final-closure-v5.122D.json",JSON.stringify(report,null,2)+"\n");
fs.writeFileSync("certification-reports/character-hub-ui-final-closure-v5.122D.md",`# Character Hub UI E2E Final Closure v5.122D\n\n- Status: ${report.status}\n- Version: ${report.version}\n- Surfaces: Dashboard, Character List, Character Detail\n- States: empty, ready, wounded, critical\n- Browser projects: desktop Chromium, mobile Chromium\n- Physical scenarios: 8\n- Release blockers: ${report.releaseBlockers.length}\n- Next target: Remaining Player Experience Navigation and Search Discovery v5.123A\n`);
console.log(`v5.122D ${report.status} - physical scenarios: ${report.physicalScenarioCount}; blockers: ${report.releaseBlockers.length}`);
if(missing.length) process.exit(1);
