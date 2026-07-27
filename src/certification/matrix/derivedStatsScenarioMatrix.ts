import {
  certifiedInitiative,
  certifiedPassivePerception,
  certifiedSavingThrow,
  certifiedSkillBonus,
  certifiedSpellSaveDc,
  type AbilityRecord,
} from "../oracle/abilityProficiencyOracle";

export type DerivedScenario = {
  id: string;
  level: number;
  abilities: AbilityRecord;
  skill: string;
  proficiency: 0 | 1 | 2;
  initiative: number;
  passivePerception: number;
  skillBonus: number;
  wisdomSave: number;
  spellSaveDc: number;
};

const SCORE_SETS: AbilityRecord[] = [
  { str:15,dex:14,con:13,int:12,wis:10,cha:8 },
  { str:8,dex:15,con:14,int:13,wis:12,cha:10 },
  { str:10,dex:12,con:14,int:15,wis:13,cha:8 },
  { str:8,dex:12,con:14,int:10,wis:15,cha:13 },
  { str:10,dex:14,con:12,int:8,wis:13,cha:15 },
];

const LEVELS = [1,2,3,4,5,8,9,12,13,16,17,20];
const SKILLS = ["Athletics","Stealth","Arcana","Perception","Persuasion"];

export function generateDerivedStatsScenarios(): DerivedScenario[] {
  const output: DerivedScenario[] = [];

  for (let i = 0; i < 240; i += 1) {
    const level = LEVELS[i % LEVELS.length];
    const abilities = SCORE_SETS[(i * 3) % SCORE_SETS.length];
    const skill = SKILLS[(i * 7) % SKILLS.length];
    const proficiency = (i % 3) as 0 | 1 | 2;

    output.push({
      id:`derived-${i+1}`,
      level,
      abilities,
      skill,
      proficiency,
      initiative:certifiedInitiative(abilities.dex),
      passivePerception:certifiedPassivePerception({
        wisdom:abilities.wis,
        level,
        proficiency,
      }),
      skillBonus:certifiedSkillBonus({
        skill,
        abilities,
        level,
        proficiency,
      }),
      wisdomSave:certifiedSavingThrow({
        score:abilities.wis,
        level,
        proficient:i % 2 === 0,
      }),
      spellSaveDc:certifiedSpellSaveDc({
        castingScore:abilities.wis,
        level,
      }),
    });
  }

  return output;
}
