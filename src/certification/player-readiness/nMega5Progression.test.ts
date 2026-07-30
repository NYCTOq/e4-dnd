import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runtimeApplySingleClassLevelUp, runtimeBuildMilestone, type LevelUpCharacterState } from "../../core/rulesets/levelUpProgressionRules";
const root=process.cwd();
const classes=[['barbarian',12],['bard',8],['cleric',8],['druid',8],['fighter',10],['monk',8],['paladin',10],['ranger',10],['rogue',8],['sorcerer',6],['warlock',8],['wizard',6]] as const;
describe('N-MEGA5 level 1-20 progression certification',()=>{
 it('ships the complete generated 456-transition matrix',()=>{
  const summary=JSON.parse(fs.readFileSync(path.join(root,'certification-reports','n-mega5','N_MEGA5_SUMMARY.json'),'utf8'));
  const transitions=JSON.parse(fs.readFileSync(path.join(root,'certification-reports','n-mega5','N_MEGA5_456_TRANSITIONS.json'),'utf8'));
  expect(summary.levelRows).toBe(480); expect(summary.transitionCount).toBe(456); expect(transitions).toHaveLength(456); expect(summary.counts.critical).toBe(0); expect(summary.counts.high).toBe(0);
 });
 for(const ruleset of ['dnd_2014','dnd_2024'] as const) for(const [classId,hitDie] of classes) for(let current=1;current<20;current++) it(`${ruleset}/${classId}/${current}->${current+1}`,()=>{
  const state:LevelUpCharacterState={level:current,ruleset,constitutionScore:14,maxHp:current*8,classes:[{classId,classLevel:current,hitDie}]};
  const next=runtimeApplySingleClassLevelUp(state,classId); expect(next.level).toBe(current+1); expect(next.maxHp).toBeGreaterThan(state.maxHp);
  const m=runtimeBuildMilestone(classId,ruleset,current,current+1); expect(m.level).toBe(current+1); expect(m.proficiencyBonus).toBe(2+Math.floor(current/4));
 });
});
