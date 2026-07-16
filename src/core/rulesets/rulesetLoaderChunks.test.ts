import{describe,expect,it}from"vitest";
describe("ruleset loader chunks",()=>{it("keeps expansion modules dynamically imported",async()=>{const source=await import("./rulesetLoader?raw").then(module=>module.default as string);expect(source).toContain('import("./spellExpansion")');expect(source).toContain('import("./itemExpansion")');expect(source).not.toContain('from "./spellExpansion"')})});
