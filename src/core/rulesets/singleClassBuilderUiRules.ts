export type SingleClassBuilderUiStatus = {
  ready: boolean;
  officialRuleset: boolean;
  subclassRequired: boolean;
  subclassUnlocked: boolean;
  messages: string[];
};

export function getSingleClassBuilderUiStatus(input: {
  ruleset: string;
  level: number;
  race: string;
  className: string;
  subclass: string;
  subclassLevel?: number;
}): SingleClassBuilderUiStatus {
  const officialRuleset = input.ruleset === "dnd_2014" || input.ruleset === "dnd_2024";
  const level = Math.max(1, Math.min(20, Math.trunc(input.level || 1)));
  const subclassLevel = Math.max(1, Math.trunc(input.subclassLevel || 1));
  const subclassUnlocked = Boolean(input.className) && level >= subclassLevel;
  const subclassRequired = officialRuleset && subclassUnlocked;
  const messages: string[] = [];

  if (!officialRuleset) messages.push("Homebrew içerik resmî tek-sınıf sertifikasyon kapsamı dışındadır.");
  if (!input.race.trim()) messages.push("Race/Species seçimi eksik.");
  if (!input.className.trim()) messages.push("Class seçimi eksik.");
  if (subclassRequired && !input.subclass.trim()) messages.push(`Level ${subclassLevel} itibarıyla subclass seçimi gerekli.`);
  if (!subclassUnlocked && input.className.trim()) messages.push(`Subclass Level ${subclassLevel} seviyesinde açılır; mevcut level için seçim gerekmez.`);

  return {
    ready: officialRuleset && Boolean(input.race.trim()) && Boolean(input.className.trim()) && (!subclassRequired || Boolean(input.subclass.trim())),
    officialRuleset,
    subclassRequired,
    subclassUnlocked,
    messages,
  };
}
