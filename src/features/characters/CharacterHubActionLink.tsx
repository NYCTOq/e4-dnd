import { NavLink } from "react-router-dom";
import type { Character } from "../../core/character/character.types";
import { getCharacterHubInput, projectCharacterHubDecision, type CharacterHubSurface } from "../../core/character/characterHubActionability";

export function CharacterHubActionLink({surface,character,className="primary-action"}:{surface:CharacterHubSurface;character:Character|null|undefined;className?:string}) {
  const decision=projectCharacterHubDecision(surface,getCharacterHubInput(character));
  const id=character?.id ?? "empty";
  return <NavLink className={className} to={decision.route} data-testid={`character-hub-action-${surface}-${id}`} data-action-id={decision.actionId} data-action-state={decision.state} aria-label={`${decision.label}: ${decision.reason}`}><span>{decision.label}</span></NavLink>;
}
