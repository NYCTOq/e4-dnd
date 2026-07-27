export const ADVANCED_MULTICLASS_GOLDEN = [
  {
    id: "fighter-rogue-2014",
    ruleset: "dnd_2014",
    primary: "Fighter",
    target: "Rogue",
    skill: "Stealth",
    expectedProficiencies: ["Light armor", "One Rogue skill", "Thieves' tools"],
    expectedTool: "Thieves' tools",
  },
  {
    id: "wizard-fighter-2024",
    ruleset: "dnd_2024",
    primary: "Wizard",
    target: "Fighter",
    expectedProficiencies: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  },
  {
    id: "cleric-bard-2024",
    ruleset: "dnd_2024",
    primary: "Cleric",
    target: "Bard",
    skill: "Persuasion",
    tool: "Lute",
    expectedProficiencies: ["Light armor", "One skill", "One musical instrument"],
    expectedTool: "Lute",
  },
] as const;
