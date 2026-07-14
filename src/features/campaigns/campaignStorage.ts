import type {
  Campaign,
  CampaignEncounter,
  CampaignEncounterParticipant,
} from "./campaignTypes";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";

const CAMPAIGNS_STORAGE_KEY = "e4_dnd_campaigns_v1";

export function loadCampaigns(): Campaign[] {
  const parsed = readJsonSafely<unknown[]>(
    CAMPAIGNS_STORAGE_KEY,
    [],
    (value): value is unknown[] => Array.isArray(value),
  );

  return parsed
    .filter((campaign) => Boolean(campaign) && typeof campaign === "object")
    .map((campaign: any) => ({
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
      timelineEntries: Array.isArray(campaign.timelineEntries)
        ? campaign.timelineEntries
            .filter((entry: unknown) => Boolean(entry) && typeof entry === "object")
            .map((entry: unknown) => {
              const parsed = entry as {
                id?: unknown; title?: unknown; sessionDate?: unknown; summary?: unknown;
                events?: unknown; npcs?: unknown; questUpdates?: unknown; loot?: unknown;
                casualties?: unknown; notes?: unknown; createdAt?: unknown; updatedAt?: unknown;
              };
              const strings = (value: unknown) =>
                Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
              const now = new Date().toISOString();
              return {
                id: typeof parsed.id === "string" ? parsed.id : crypto.randomUUID(),
                title: typeof parsed.title === "string" ? parsed.title : "Untitled Session",
                sessionDate: typeof parsed.sessionDate === "string" ? parsed.sessionDate : now.slice(0, 10),
                summary: typeof parsed.summary === "string" ? parsed.summary : "",
                events: strings(parsed.events),
                npcs: strings(parsed.npcs),
                questUpdates: strings(parsed.questUpdates),
                loot: strings(parsed.loot),
                casualties: strings(parsed.casualties),
                notes: typeof parsed.notes === "string" ? parsed.notes : "",
                createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : now,
                updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : now,
              };
            })
        : [],
      timelineEnabled:
        typeof campaign.timelineEnabled === "boolean"
          ? campaign.timelineEnabled
          : false,
      encounterTools: {
        difficulty:
          typeof campaign.encounterTools?.difficulty === "boolean"
            ? campaign.encounterTools.difficulty
            : false,
        loot:
          typeof campaign.encounterTools?.loot === "boolean"
            ? campaign.encounterTools.loot
            : false,
        conditions:
          typeof campaign.encounterTools?.conditions === "boolean"
            ? campaign.encounterTools.conditions
            : false,
        combatRolls:
          typeof campaign.encounterTools?.combatRolls === "boolean"
            ? campaign.encounterTools.combatRolls
            : false,
      },
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
                    conditions: Array.isArray(participant.conditions)
                      ? participant.conditions
                          .filter((condition: unknown) =>
                            Boolean(condition) &&
                            typeof condition === "object" &&
                            typeof (condition as { name?: unknown }).name === "string",
                          )
                          .map((condition: unknown) => {
                            const parsed = condition as {
                              id?: unknown;
                              name?: unknown;
                              remainingRounds?: unknown;
                            };

                            return {
                              id:
                                typeof parsed.id === "string"
                                  ? parsed.id
                                  : crypto.randomUUID(),
                              name: String(parsed.name),
                              remainingRounds:
                                typeof parsed.remainingRounds === "number" &&
                                parsed.remainingRounds > 0
                                  ? parsed.remainingRounds
                                  : null,
                            };
                          })
                      : [],
                  }))
              : [],
            rewards: Array.isArray(encounter.rewards)
              ? encounter.rewards
                  .filter((reward: unknown) => Boolean(reward) && typeof reward === "object")
                  .map((reward: unknown) => {
                    const parsed = reward as {
                      id?: unknown;
                      type?: unknown;
                      name?: unknown;
                      quantity?: unknown;
                      valueGp?: unknown;
                      itemId?: unknown;
                      notes?: unknown;
                      createdAt?: unknown;
                    };

                    return {
                      id: typeof parsed.id === "string" ? parsed.id : crypto.randomUUID(),
                      type:
                        parsed.type === "currency" ||
                        parsed.type === "item" ||
                        parsed.type === "manual"
                          ? parsed.type
                          : "manual",
                      name: typeof parsed.name === "string" ? parsed.name : "Unnamed Reward",
                      quantity:
                        typeof parsed.quantity === "number" && parsed.quantity > 0
                          ? parsed.quantity
                          : 1,
                      valueGp:
                        typeof parsed.valueGp === "number" && parsed.valueGp >= 0
                          ? parsed.valueGp
                          : 0,
                      itemId: typeof parsed.itemId === "string" ? parsed.itemId : undefined,
                      notes: typeof parsed.notes === "string" ? parsed.notes : "",
                      createdAt:
                        typeof parsed.createdAt === "string"
                          ? parsed.createdAt
                          : new Date().toISOString(),
                    };
                  })
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
}

export function saveCampaigns(campaigns: Campaign[]) {
  writeJsonSafely(CAMPAIGNS_STORAGE_KEY, campaigns);
}
