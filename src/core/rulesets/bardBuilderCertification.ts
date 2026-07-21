import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { getBardCantripCount, getBardCombatFeatures, getBardExpertiseCount, getBardicInspirationDie, getBardSpellLimit, getMagicalSecretsCount, getSongOfRestDie, type BardEdition } from "./bardRules";

export type BardCertificationRow = {
  ruleset: BardEdition;
  raceId: string;
  raceName: string;
  subclassId: string;
  subclassName: string;
  level: number;
  ready: boolean;
  blockers: string[];
  warnings: string[];
  expected: {
    inspirationDie: number;
    inspirationRecovery: "long" | "short";
    cantripCount: number;
    spellLimit: number;
    expertiseCount: number;
    songOfRestDie: number | null;
    magicalSecretsCount: number;
    countercharm: boolean;
    countercharmAction: "action" | "reaction";
    initiativeRecovery: number;
    wordsOfCreation: boolean;
  };
};

const expectedSubclassLevels = [3, 6, 14];
const requiredFeatures: Record<BardEdition, Record<string, Array<[number,string]>>> = {
  dnd_2014: {
    "college-of-lore": [[3,"Bonus Proficiencies"],[3,"Cutting Words"],[6,"Additional Magical Secrets"],[14,"Peerless Skill"]],
    "college-of-valor": [[3,"Combat Inspiration"],[3,"Bonus Proficiencies"],[6,"Extra Attack"],[14,"Battle Magic"]],
    "college-of-glamour": [[3,"Mantle of Inspiration"],[3,"Enthralling Performance"],[6,"Mantle of Majesty"],[14,"Unbreakable Majesty"]],
    "college-of-swords": [[3,"Blade Flourish"],[6,"Extra Attack"],[14,"Master's Flourish"]],
    "college-of-whispers": [[3,"Psychic Blades"],[6,"Mantle of Whispers"],[14,"Shadow Lore"]],
    "college-of-eloquence": [[3,"Silver Tongue"],[3,"Unsettling Words"],[6,"Unfailing Inspiration"],[14,"Infectious Inspiration"]],
    "college-of-creation": [[3,"Mote of Potential"],[6,"Animating Performance"],[14,"Creative Crescendo"]],
    "college-of-spirits": [[3,"Tales from Beyond"],[6,"Spirit Session"],[14,"Mystical Connection"]],
  },
  dnd_2024: {
    "college-of-lore-2024": [[3,"Bonus Proficiencies"],[3,"Cutting Words"],[6,"Magical Discoveries"],[14,"Peerless Skill"]],
    "college-of-glamour-2024": [[3,"Beguiling Magic"],[3,"Mantle of Inspiration"],[6,"Mantle of Majesty"],[14,"Unbreakable Majesty"]],
    "valor-2024": [[3,"Combat Inspiration"],[3,"Martial Training"],[6,"Extra Attack"],[14,"Battle Magic"]],
  },
};

export function certifyBardBuilder(ruleset:BardEdition,bard:DndClassData,races:DndRaceData[],subclasses:DndSubclassData[]):BardCertificationRow[]{
  const bardSubclasses=subclasses.filter(s=>s.className.toLowerCase()==="bard"&&s.ruleset===ruleset);
  const rows:BardCertificationRow[]=[];
  for(const race of races)for(const subclass of bardSubclasses)for(let level=1;level<=20;level+=1){
    const blockers:string[]=[];const warnings:string[]=[];
    const row=bard.levels.find(x=>x.level===level);
    if(!row)blockers.push(`Level ${level} progression satırı eksik.`);
    if(bard.hitDie!==8)blockers.push("Bard Hit Die d8 olmalı.");
    if(!bard.savingThrows.includes("dex")||!bard.savingThrows.includes("cha"))blockers.push("DEX/CHA saving throw proficiency eksik.");
    if(bard.skillChoices.choose!==3)blockers.push("Bard başlangıçta herhangi üç skill seçebilmeli.");
    if(bard.subclassLevel!==3)blockers.push("Bard subclass seçimi level 3 olmalı.");
    if(subclass.selectionLevel!==3)blockers.push(`${subclass.name} selection level 3 olmalı.`);
    const levels=[...new Set(subclass.features.map(f=>f.level))].sort((a,b)=>a-b);
    for(const req of expectedSubclassLevels)if(!levels.includes(req))blockers.push(`${subclass.name} level ${req} özelliği eksik.`);
    for(const [reqLevel,reqName] of requiredFeatures[ruleset][subclass.id]??[])if(!subclass.features.some(f=>f.level===reqLevel&&f.name===reqName))blockers.push(`${subclass.name}: L${reqLevel} ${reqName} eksik.`);
    if(level<3&&subclass.features.some(f=>f.level<=level))blockers.push("Subclass özelliği seçim seviyesinden önce açılıyor.");
    if(ruleset==="dnd_2024"&&bard.weaponProficiencies.some(x=>/longsword|rapier|shortsword|crossbow/i.test(x)))blockers.push("2024 Bard yalnız Simple Weapons proficiency almalı.");
    if(ruleset==="dnd_2014"&&!bard.weaponProficiencies.some(x=>/rapier/i.test(x)))blockers.push("2014 Bard rapier proficiency içermeli.");
    if(race.subraces?.length&&ruleset==="dnd_2014")warnings.push(`${race.name} için subrace seçimi zorunlu tutulmalı.`);
    if(ruleset==="dnd_2024"&&Object.keys(race.abilityBonuses).length)blockers.push(`${race.name} 2024 ability bonusunu species üzerinden vermemeli.`);
    if(ruleset==="dnd_2014"&&race.name==="Half-Elf")warnings.push("Half-Elf +1/+1, skill ve language seçimleri doğrulanmalı.");
    if(ruleset==="dnd_2024"&&["Human","Dragonborn","Elf","Gnome","Goliath","Tiefling","Aasimar"].includes(race.name))warnings.push(`${race.name} species alt seçimleri Bard Builder choice debt içinde çözülmeli.`);
    const features=getBardCombatFeatures(level,ruleset);
    rows.push({ruleset,raceId:race.id,raceName:race.name,subclassId:subclass.id,subclassName:subclass.name,level,ready:blockers.length===0,blockers,warnings,expected:{
      inspirationDie:getBardicInspirationDie(level),
      inspirationRecovery:level>=5?"short":"long",
      cantripCount:getBardCantripCount(level),
      spellLimit:getBardSpellLimit(level,ruleset),
      expertiseCount:getBardExpertiseCount(level,ruleset),
      songOfRestDie:getSongOfRestDie(level,ruleset),
      magicalSecretsCount:getMagicalSecretsCount(level,ruleset),
      countercharm:features.countercharm,
      countercharmAction:features.countercharmAction as "action" | "reaction",
      initiativeRecovery:ruleset==="dnd_2024"?(level>=18?2:0):(level>=20?1:0),
      wordsOfCreation:ruleset==="dnd_2024"&&level>=20,
    }});
  }
  return rows;
}

export function summarizeBardCertification(rows:BardCertificationRow[]){
 const blockers=rows.flatMap(r=>r.blockers.map(m=>`${r.ruleset}/${r.raceName}/${r.subclassName}/L${r.level}: ${m}`));
 const warnings=rows.flatMap(r=>r.warnings.map(m=>`${r.ruleset}/${r.raceName}/${r.subclassName}/L${r.level}: ${m}`));
 return{ready:blockers.length===0,scenarioCount:rows.length,readyCount:rows.filter(r=>r.ready).length,blockerCount:blockers.length,warningCount:warnings.length,blockers:[...new Set(blockers)],warnings:[...new Set(warnings)]};
}
