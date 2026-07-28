import type { CharacterHubDecision, CharacterHubInput, CharacterHubSurface } from "../oracle/characterHubActionabilityOracle";
import { getCanonicalCharacterHubDecision, projectCharacterHubDecision } from "../oracle/characterHubActionabilityOracle";

export type GoldenCharacterHubProfile = {
  id: string;
  name: string;
  edition: "dnd_2014" | "dnd_2024";
  archetype: "martial" | "prepared-caster" | "known-caster" | "multiclass";
  level: number;
  maxHp: number;
};

export type GoldenCharacterHubCheckpoint = {
  id: "ready" | "wounded" | "critical" | "recovered" | "level-ready" | "active-play";
  input: CharacterHubInput;
};

export type GoldenCharacterHubProjection = {
  profile: GoldenCharacterHubProfile;
  checkpoint: GoldenCharacterHubCheckpoint;
  surface: CharacterHubSurface;
  expected: CharacterHubDecision;
  actual: CharacterHubDecision;
  matches: boolean;
};

export const GOLDEN_CHARACTER_HUB_PROFILES: readonly GoldenCharacterHubProfile[] = [
  {id:"golden-fighter-2014",name:"Golden 2014 Fighter",edition:"dnd_2014",archetype:"martial",level:5,maxHp:44},
  {id:"golden-cleric-2024",name:"Golden 2024 Cleric",edition:"dnd_2024",archetype:"prepared-caster",level:7,maxHp:52},
  {id:"golden-sorcerer-2014",name:"Golden 2014 Sorcerer",edition:"dnd_2014",archetype:"known-caster",level:9,maxHp:48},
  {id:"golden-fighter-wizard-2024",name:"Golden 2024 Multiclass",edition:"dnd_2024",archetype:"multiclass",level:8,maxHp:58},
] as const;

export const GOLDEN_CHARACTER_HUB_SURFACES: readonly CharacterHubSurface[] = ["dashboard","characters","detail"];

export function buildGoldenCharacterHubCheckpoints(profile: GoldenCharacterHubProfile): GoldenCharacterHubCheckpoint[] {
  const base={characterId:profile.id,maxHp:profile.maxHp,level:profile.level};
  return [
    {id:"ready",input:{...base,currentHp:profile.maxHp,pendingLevel:false,activePlay:false}},
    {id:"wounded",input:{...base,currentHp:Math.max(1,profile.maxHp-11),pendingLevel:false,activePlay:false}},
    {id:"critical",input:{...base,currentHp:0,pendingLevel:true,activePlay:true}},
    {id:"recovered",input:{...base,currentHp:profile.maxHp,pendingLevel:false,activePlay:false}},
    {id:"level-ready",input:{...base,currentHp:profile.maxHp,pendingLevel:true,activePlay:false}},
    {id:"active-play",input:{...base,currentHp:Math.max(1,profile.maxHp-4),pendingLevel:true,activePlay:true}},
  ];
}

export function buildGoldenCharacterHubProjections(): GoldenCharacterHubProjection[] {
  return GOLDEN_CHARACTER_HUB_PROFILES.flatMap(profile =>
    buildGoldenCharacterHubCheckpoints(profile).flatMap(checkpoint =>
      GOLDEN_CHARACTER_HUB_SURFACES.map(surface => {
        const expected=getCanonicalCharacterHubDecision(checkpoint.input);
        const actual=projectCharacterHubDecision(surface,checkpoint.input);
        return {profile,checkpoint,surface,expected,actual,matches: expected.state===actual.state && expected.actionId===actual.actionId && expected.label===actual.label && expected.route===actual.route && expected.rank===actual.rank};
      })
    )
  );
}

export function buildGoldenCharacterHubReport(version="5.122.2") {
  const projections=buildGoldenCharacterHubProjections();
  const mismatches=projections.filter(item=>!item.matches);
  return {package:"v5.122C",version,status:mismatches.length===0?"GREEN":"BLOCKED",profileCount:GOLDEN_CHARACTER_HUB_PROFILES.length,checkpointCount:6,surfaceCount:GOLDEN_CHARACTER_HUB_SURFACES.length,projectionCount:projections.length,mismatchCount:mismatches.length,nextPackage:"v5.122D",projections};
}
