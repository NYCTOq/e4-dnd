import fs from "node:fs";import path from "node:path";import{describe,expect,it}from"vitest";
const root=process.cwd(),out=path.join(root,"certification-reports","n-mega4");
describe("N-MEGA4 builder closure contract",()=>{
 it("produces a zero-critical builder audit",()=>{const r=JSON.parse(fs.readFileSync(path.join(out,"N_MEGA4_BUILDER_CHOICE_VALIDATION_AUDIT.json"),"utf8"));expect(r.phase).toBe("N-MEGA4");expect(r.severityCounts.critical).toBe(0);expect(Object.keys(r.contracts).length).toBeGreaterThanOrEqual(12);});
 it("keeps required builder regression files present",()=>{const r=JSON.parse(fs.readFileSync(path.join(out,"N_MEGA4_BUILDER_CHOICE_VALIDATION_AUDIT.json"),"utf8"));for(const f of r.requiredTests)expect(fs.existsSync(path.join(root,f)),f).toBe(true);});
});
