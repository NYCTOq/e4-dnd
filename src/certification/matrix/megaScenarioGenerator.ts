export type MegaScenario = {
  id: string;
  ruleset: "dnd_2014" | "dnd_2024";
  ancestry: string;
  className: string;
  background: string;
  level: number;
  viewport: "desktop" | "mobile";
};

const RACES_2014 = ["Human","Dwarf","Elf","Halfling","Dragonborn","Gnome","Half-Elf","Half-Orc","Tiefling"];
const SPECIES_2024 = ["Aasimar","Dragonborn","Dwarf","Elf","Gnome","Goliath","Halfling","Human","Orc","Tiefling"];
const CLASSES = ["Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard"];
const BACKGROUNDS_2014 = ["Acolyte","Criminal","Entertainer","Folk Hero","Guild Artisan","Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin"];
const BACKGROUNDS_2024 = ["Acolyte","Artisan","Charlatan","Criminal","Entertainer","Farmer","Guard","Guide","Hermit","Merchant","Noble","Sage","Sailor","Scribe","Soldier","Wayfarer"];
const LEVELS = [1,2,3,4,5,8,11,17,20];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function generateMegaScenarios(): MegaScenario[] {
  const output: MegaScenario[] = [];
  const configs = [
    { ruleset:"dnd_2014" as const, ancestry:RACES_2014, backgrounds:BACKGROUNDS_2014 },
    { ruleset:"dnd_2024" as const, ancestry:SPECIES_2024, backgrounds:BACKGROUNDS_2024 },
  ];

  for (const config of configs) {
    const target = Math.max(config.ancestry.length, CLASSES.length, config.backgrounds.length) * 4;
    for (let i = 0; i < target; i += 1) {
      const ancestry = config.ancestry[i % config.ancestry.length];
      const className = CLASSES[(i * 5 + 1) % CLASSES.length];
      const background = config.backgrounds[(i * 7 + 2) % config.backgrounds.length];
      const level = LEVELS[(i * 11 + 3) % LEVELS.length];

      for (const viewport of ["desktop","mobile"] as const) {
        output.push({
          id: slug(`${config.ruleset}-${ancestry}-${className}-${background}-l${level}-${viewport}`),
          ruleset:config.ruleset,
          ancestry,
          className,
          background,
          level,
          viewport,
        });
      }
    }
  }

  return [...new Map(output.map((scenario) => [scenario.id, scenario])).values()];
}
