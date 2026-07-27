import { CERTIFIED_CLASSES } from "../reference/classes.full.reference";
import {
  CERTIFIED_BACKGROUNDS_2014,
  CERTIFIED_BACKGROUNDS_2024,
} from "../reference/backgrounds.full.reference";

export function getCertifiedClass(idOrName: string) {
  const query = idOrName.trim().toLowerCase();
  return CERTIFIED_CLASSES.find(
    (entry) => entry.id === query || entry.name.toLowerCase() === query,
  );
}

export function getCertifiedBackground(
  ruleset: "dnd_2014" | "dnd_2024",
  idOrName: string,
) {
  const query = idOrName.trim().toLowerCase();
  const catalog =
    ruleset === "dnd_2014"
      ? CERTIFIED_BACKGROUNDS_2014
      : CERTIFIED_BACKGROUNDS_2024;

  return catalog.find(
    (entry) => entry.id === query || entry.name.toLowerCase() === query,
  );
}

export function expectedBaseSkillCount(params: {
  ruleset: "dnd_2014" | "dnd_2024";
  className: string;
  backgroundName: string;
  ancestryFixedSkills?: number;
  ancestrySkillChoices?: number;
}) {
  const classEntry = getCertifiedClass(params.className);
  const background = getCertifiedBackground(params.ruleset, params.backgroundName);

  if (!classEntry) throw new Error(`Unknown class: ${params.className}`);
  if (!background) throw new Error(`Unknown background: ${params.backgroundName}`);

  return (
    classEntry.skillChoices +
    background.skillCount +
    (params.ancestryFixedSkills ?? 0) +
    (params.ancestrySkillChoices ?? 0)
  );
}
