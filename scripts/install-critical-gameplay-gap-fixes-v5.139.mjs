import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const playPath = path.join(root, "src/features/play-mode/PlayMode.tsx");
const packagePath = path.join(root, "package.json");

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, value) { fs.writeFileSync(file, value, "utf8"); }
function replaceOnce(value, before, after, label) {
  if (value.includes(after)) return value;
  const count = value.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  return value.replace(before, after);
}

let play = read(playPath);
play = replaceOnce(
  play,
  'import { getSpellMaterialReadiness } from "../../core/rulesets/spellMaterialRules";',
  'import { getSpellMaterialReadiness } from "../../core/rulesets/spellMaterialRules";\nimport { evaluateGameplayGuard, getCastingEconomy } from "../../core/runtime/criticalGameplayGuards";',
  "guard import",
);

play = replaceOnce(
  play,
  '  function executeClassAction(resourceId:string,amount=1){const resource=activeCharacter.resources.find(item=>item.id===resourceId);if(!resource||(!resource.unlimited&&resource.max-resource.used<amount))return;',
  '  function executeClassAction(resourceId:string,amount=1){const resource=activeCharacter.resources.find(item=>item.id===resourceId);const guard=evaluateGameplayGuard({resourceRemaining:resource?.unlimited?Number.POSITIVE_INFINITY:resource?resource.max-resource.used:0,resourceCost:amount});if(!resource||!guard.allowed){setActionFeedback(guard.allowed?"Kaynak bulunamadı":guard.reason);return;}',
  "class resource guard",
);

const oldCast = `    if (!spell) return;\n    if(itemEffectRuntime.blocksAggressiveActions)return;\n    const spellTime=spell.castingTime.toLowerCase();\n    if ((spellTime.includes("bonus")&&turnEconomy.bonusActionUsed)||(spellTime.includes("reaction")&&turnEconomy.reactionUsed)||(!spellTime.includes("bonus")&&!spellTime.includes("reaction")&&turnEconomy.actionUsed)) return;\n\n    const slotLevel=spell.level===0?0:requestedSlotLevel??getCastableSlotLevels(spell,spellSlots)[0];\n    if (spell.level > 0 && consumeSlot) {\n      const slot = spellSlots.find((item) => item.level === slotLevel);\n      if (!slot || slot.used >= slot.max) return;\n    }`;
const newCast = `    if (!spell) { setActionFeedback("Büyü verisi bulunamadı."); return; }\n    const spellTime=spell.castingTime.toLowerCase();\n    const castingEconomy=getCastingEconomy(spell.castingTime);\n    const slotLevel=spell.level===0?0:requestedSlotLevel??getCastableSlotLevels(spell,spellSlots)[0];\n    const slot=spell.level>0&&consumeSlot?spellSlots.find(item=>item.level===slotLevel):undefined;\n    const guard=evaluateGameplayGuard({\n      economy:castingEconomy,\n      actionUsed:turnEconomy.actionUsed,\n      bonusActionUsed:turnEconomy.bonusActionUsed,\n      reactionUsed:turnEconomy.reactionUsed,\n      blockedByEffect:itemEffectRuntime.blocksAggressiveActions,\n      requiresSlot:spell.level>0&&consumeSlot,\n      slotRemaining:slot?slot.max-slot.used:0,\n    });\n    if(!guard.allowed){setActionFeedback(guard.reason);return;}`;
play = replaceOnce(play, oldCast, newCast, "spell guard");
write(playPath, play);

const pkg = JSON.parse(read(packagePath));
pkg.version = "5.139.0";
pkg.scripts ??= {};
pkg.scripts["test:critical-gameplay-gap-fixes"] = "vitest run src/core/runtime/criticalGameplayGuards-v5.139.test.ts";
pkg.scripts["certify:critical-gameplay-gap-fixes"] = "npm run test:critical-gameplay-gap-fixes && npm run build";
write(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("v5.139 critical gameplay gap fixes applied.");
