import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const resolutionPath=path.join(ROOT,'src/core/rulesets/spellOutcomeResolution.ts');
const panelPath=path.join(ROOT,'src/components/spells/SpellCastingRuntimePanel.tsx');
const testPath=path.join(ROOT,'src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts');
function req(f){if(!fs.existsSync(f))throw new Error('Required file not found: '+f)}
function rep(s,a,b,l){if(!s.includes(a))throw new Error('Patch anchor not found: '+l);return s.replace(a,b)}
const resolution=`import { getSpellRollFormula, rollFormula } from "./spellResolution";

export type ResolvableSpell = {
  id: string;
  name?: string;
  level: number;
  attackType?: string;
  damageDice?: string;
  healingDice?: string;
  damageType?: string;
  saveAbility?: string;
  saveDamageRule?: "full" | "half" | "none";
  scaling?: { mode?: string; dicePerStep?: string; flatPerStep?: number };
};

export type SpellOutcomeRequest = {
  spell: ResolvableSpell;
  characterLevel: number;
  castLevel?: number;
  spellAttackBonus?: number;
  spellSaveDc?: number;
  attackD20?: number;
  targetArmorClass?: number;
  targetSaveTotal?: number;
  random?: () => number;
};

export type SpellOutcome = {
  formula: string | null;
  rawTotal: number | null;
  appliedTotal: number | null;
  kind: "damage" | "healing" | "utility";
  attackTotal: number | null;
  attackHit: boolean | null;
  saveSucceeded: boolean | null;
  saveDc: number | null;
  damageType: string | null;
  castLevel: number;
  summary: string;
};

const clampD20=(value:number|undefined)=>typeof value==="number"&&Number.isFinite(value)?Math.min(20,Math.max(1,Math.floor(value))):null;

/** Resolves the numerical outcome of a spell without mutating character state. */
export function resolveSpellOutcome(request: SpellOutcomeRequest): SpellOutcome {
  const { spell } = request;
  const castLevel = spell.level === 0 ? 0 : Math.max(spell.level, Math.floor(request.castLevel ?? spell.level));
  const formula = getSpellRollFormula(spell as never, Math.max(1, Math.floor(request.characterLevel)), castLevel);
  const rawTotal = formula ? rollFormula(formula, request.random ?? Math.random) : null;
  const kind: SpellOutcome["kind"] = spell.healingDice ? "healing" : spell.damageDice ? "damage" : "utility";

  const attackD20 = clampD20(request.attackD20);
  const attackTotal = attackD20 === null ? null : attackD20 + Math.floor(request.spellAttackBonus ?? 0);
  const attackHit = attackTotal === null || typeof request.targetArmorClass !== "number"
    ? null
    : attackTotal >= request.targetArmorClass;

  const saveDc = spell.saveAbility ? Math.floor(request.spellSaveDc ?? 0) : null;
  const saveSucceeded = saveDc === null || typeof request.targetSaveTotal !== "number"
    ? null
    : request.targetSaveTotal >= saveDc;

  let appliedTotal = rawTotal;
  if (kind === "damage" && rawTotal !== null) {
    if (attackHit === false) appliedTotal = 0;
    if (saveSucceeded === true) {
      if (spell.saveDamageRule === "half") appliedTotal = Math.floor(rawTotal / 2);
      else if (spell.saveDamageRule === "none" || !spell.saveDamageRule) appliedTotal = 0;
    }
  }

  const parts: string[] = [];
  parts.push(spell.name ?? spell.id);
  if (castLevel > spell.level) parts.push(castLevel + ". seviye upcast");
  if (formula) parts.push(formula + " = " + rawTotal);
  if (attackHit !== null) parts.push(attackHit ? "saldırı isabet" : "saldırı ıskaladı");
  if (saveSucceeded !== null) parts.push(saveSucceeded ? "hedef save başarılı" : "hedef save başarısız");
  if (appliedTotal !== rawTotal && appliedTotal !== null) parts.push("uygulanan: " + appliedTotal);

  return { formula, rawTotal, appliedTotal, kind, attackTotal, attackHit, saveSucceeded, saveDc, damageType: spell.damageType ?? null, castLevel, summary: parts.join(" · ") };
}
`;
const test=`import { describe, expect, it } from "vitest";
import { resolveSpellOutcome } from "./spellOutcomeResolution";
const maxRoll=()=>0.999999;

describe("N-MEGA7B spell outcome resolution",()=>{
  it("scales cantrip damage by character level",()=>{
    const result=resolveSpellOutcome({spell:{id:"fire-bolt",level:0,damageDice:"1d10",scaling:{mode:"character-level",dicePerStep:"1d10"}},characterLevel:11,random:maxRoll});
    expect(result.formula).toBe("3d10");
    expect(result.rawTotal).toBe(30);
  });
  it("applies slot-level upcast dice",()=>{
    const result=resolveSpellOutcome({spell:{id:"cure-wounds",level:1,healingDice:"1d8",scaling:{mode:"slot-level",dicePerStep:"1d8"}},characterLevel:5,castLevel:3,random:maxRoll});
    expect(result.formula).toBe("3d8");
    expect(result.appliedTotal).toBe(24);
    expect(result.kind).toBe("healing");
  });
  it("resolves spell attacks against armor class",()=>{
    const result=resolveSpellOutcome({spell:{id:"chromatic-orb",level:1,damageDice:"3d8",attackType:"spell-attack"},characterLevel:3,spellAttackBonus:5,attackD20:9,targetArmorClass:15,random:maxRoll});
    expect(result.attackTotal).toBe(14);
    expect(result.attackHit).toBe(false);
    expect(result.appliedTotal).toBe(0);
  });
  it("applies half damage after a successful save",()=>{
    const result=resolveSpellOutcome({spell:{id:"fireball",level:3,damageDice:"8d6",saveAbility:"dexterity",saveDamageRule:"half"},characterLevel:5,spellSaveDc:15,targetSaveTotal:16,random:maxRoll});
    expect(result.rawTotal).toBe(48);
    expect(result.saveSucceeded).toBe(true);
    expect(result.appliedTotal).toBe(24);
  });
  it("applies zero damage for a successful save when the spell says none",()=>{
    const result=resolveSpellOutcome({spell:{id:"sacred-flame",level:0,damageDice:"1d8",saveAbility:"dexterity",saveDamageRule:"none",scaling:{mode:"character-level",dicePerStep:"1d8"}},characterLevel:5,spellSaveDc:14,targetSaveTotal:14,random:maxRoll});
    expect(result.rawTotal).toBe(16);
    expect(result.appliedTotal).toBe(0);
  });
});
`;
req(panelPath);
fs.writeFileSync(resolutionPath,resolution);
fs.writeFileSync(testPath,test);
let panel=fs.readFileSync(panelPath,'utf8');
if(!panel.includes('spell-runtime-resolve-button')){
  panel=rep(panel,'import { recoverSpellcastingResources } from "../../core/rulesets/spellRuntimeCompletion";','import { recoverSpellcastingResources } from "../../core/rulesets/spellRuntimeCompletion";\nimport { resolveSpellOutcome } from "../../core/rulesets/spellOutcomeResolution";','resolution import');
  panel=rep(panel,'  const [slotSource, setSlotSource] = useState<"spell" | "pact">("spell");','  const [slotSource, setSlotSource] = useState<"spell" | "pact">("spell");\n  const [targetArmorClass, setTargetArmorClass] = useState(10);\n  const [targetSaveTotal, setTargetSaveTotal] = useState(10);','resolution state');
  const castEnd='  const castSelectedSpell = () => {\n    if (!selectedSpell) { setFeedback("Kullanılacak büyüyü seç."); return; }\n    const transaction = castCharacterSpell(character, selectedSpell, castLevel, slotSource);\n    if (!transaction.ok) { setFeedback(transaction.reason ?? "Büyü kullanılamadı."); return; }\n    onCharacterChange(transaction.character as T);\n    const upcast = transaction.castLevel > selectedSpell.level ? " (" + transaction.castLevel + ". seviyede)" : "";\n    const replaced = transaction.replacedConcentrationSpellId ? " Önceki konsantrasyon sona erdi: " + transaction.replacedConcentrationSpellId + "." : "";\n    setFeedback(String(selectedSpell.name ?? selectedSpell.id) + upcast + " kullanıldı." + replaced);\n  };\n';
  const withResolve=castEnd+'\n  const resolveSelectedSpell = () => {\n    if (!selectedSpell) { setFeedback("Çözümlenecek büyüyü seç."); return; }\n    const attackD20 = Math.floor(Math.random() * 20) + 1;\n    const result = resolveSpellOutcome({ spell: selectedSpell, characterLevel: snapshot.characterLevel, castLevel, spellAttackBonus: snapshot.spellAttackBonus, spellSaveDc: snapshot.spellSaveDc, attackD20, targetArmorClass, targetSaveTotal });\n    setFeedback(result.summary);\n  };\n';
  panel=rep(panel,castEnd,withResolve,'resolution handler');
  const button='<button type="button" onClick={castSelectedSpell} disabled={!selectedSpell || (selectedSpell.level > 0 && castableLevels.length === 0)} data-testid="spell-runtime-cast-button">Kullan</button>';
  const enhanced=button+'\n            <label>Hedef AC <input type="number" min="1" value={targetArmorClass} onChange={(event) => setTargetArmorClass(Math.max(1, Number(event.target.value) || 1))} data-testid="spell-runtime-target-ac" /></label>\n            <label>Hedef save toplamı <input type="number" value={targetSaveTotal} onChange={(event) => setTargetSaveTotal(Number(event.target.value) || 0)} data-testid="spell-runtime-target-save" /></label>\n            <button type="button" onClick={resolveSelectedSpell} disabled={!selectedSpell} data-testid="spell-runtime-resolve-button">Etkiyi Zar Atarak Çöz</button>';
  panel=rep(panel,button,enhanced,'resolution ui');
  fs.writeFileSync(panelPath,panel);
}
console.log('N-MEGA7B spell outcome resolution applied.');
