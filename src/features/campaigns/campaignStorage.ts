import type {
  Campaign,
  CampaignEncounter,
  CampaignEncounterParticipant,
} from "./campaignTypes";

const CAMPAIGNS_STORAGE_KEY = "e4_dnd_campaigns_v1";

export function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((campaign) => ({
      id: typeof campaign.id === "string" ? campaign.id : crypto.randomUUID(),
      name:
        typeof campaign.name === "string" ? campaign.name : "Unnamed Campaign",
      description:
        typeof campaign.description === "string" ? campaign.description : "",
      characterIds: Array.isArray(campaign.characterIds)
        ? campaign.characterIds.filter((id: unknown) => typeof id === "string")
        : [],
      sessionNotes: Array.isArray(campaign.sessionNotes)
        ? campaign.sessionNotes
        : [],
      npcNotes: Array.isArray(campaign.npcNotes) ? campaign.npcNotes : [],
      quests: Array.isArray(campaign.quests) ? campaign.quests : [],
      encounters: Array.isArray(campaign.encounters)
        ? campaign.encounters.map((encounter: Partial<CampaignEncounter>) => ({
            id:
              typeof encounter.id === "string"
                ? encounter.id
                : crypto.randomUUID(),
            name:
              typeof encounter.name === "string"
                ? encounter.name
                : "Unnamed Encounter",
            round:
              typeof encounter.round === "number" && encounter.round > 0
                ? encounter.round
                : 1,
            activeTurnIndex:
              typeof encounter.activeTurnIndex === "number"
                ? encounter.activeTurnIndex
                : 0,
            isActive:
              typeof encounter.isActive === "boolean"
                ? encounter.isActive
                : true,
            participants: Array.isArray(encounter.participants)
              ? encounter.participants
                  .filter(
                    (participant: Partial<CampaignEncounterParticipant>) =>
                      typeof participant.id === "string" &&
                      typeof participant.name === "string",
                  )
                  .map((participant: Partial<CampaignEncounterParticipant>) => ({
                    id: participant.id,
                    sourceType:
                      participant.sourceType === "character" ||
                      participant.sourceType === "monster"
                        ? participant.sourceType
                        : "monster",
                    sourceId:
                      typeof participant.sourceId === "string"
                        ? participant.sourceId
                        : "",
                    name: participant.name,
                    armorClass:
                      typeof participant.armorClass === "number"
                        ? participant.armorClass
                        : 10,
                    maxHp:
                      typeof participant.maxHp === "number"
                        ? participant.maxHp
                        : 1,
                    currentHp:
                      typeof participant.currentHp === "number"
                        ? participant.currentHp
                        : typeof participant.maxHp === "number"
                          ? participant.maxHp
                          : 1,
                    initiative:
                      typeof participant.initiative === "number"
                        ? participant.initiative
                        : null,
                    initiativeModifier:
                      typeof participant.initiativeModifier === "number"
                        ? participant.initiativeModifier
                        : 0,
                    notes:
                      typeof participant.notes === "string"
                        ? participant.notes
                        : "",
                  }))
              : [],
            createdAt:
              typeof encounter.createdAt === "string"
                ? encounter.createdAt
                : new Date().toISOString(),
            updatedAt:
              typeof encounter.updatedAt === "string"
                ? encounter.updatedAt
                : new Date().toISOString(),
          }))
        : [],
      createdAt:
        typeof campaign.createdAt === "string"
          ? campaign.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof campaign.updatedAt === "string"
          ? campaign.updatedAt
          : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
}
