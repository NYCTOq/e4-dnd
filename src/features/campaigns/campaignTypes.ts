export type CampaignNote = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type CampaignNpc = {
  id: string;
  name: string;
  role: string;
  notes: string;
  createdAt: string;
};

export type CampaignQuest = {
  id: string;
  title: string;
  status: "active" | "completed" | "failed";
  notes: string;
  createdAt: string;
};

export type CampaignEncounterCondition = {
  id: string;
  name: string;
  remainingRounds: number | null;
};

export type CampaignEncounterParticipant = {
  id: string;
  sourceType: "character" | "monster";
  sourceId: string;
  name: string;
  armorClass: number;
  maxHp: number;
  currentHp: number;
  initiative: number | null;
  initiativeModifier: number;
  notes: string;
  conditions: CampaignEncounterCondition[];
};

export type CampaignEncounterReward = {
  id: string;
  type: "currency" | "item" | "manual";
  name: string;
  quantity: number;
  valueGp: number;
  itemId?: string;
  notes: string;
  createdAt: string;
};


export type CampaignTimelineEntry = {
  id: string;
  title: string;
  sessionDate: string;
  summary: string;
  events: string[];
  npcs: string[];
  questUpdates: string[];
  loot: string[];
  casualties: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignEncounterToolPreferences = {
  difficulty: boolean;
  loot: boolean;
  conditions: boolean;
  combatRolls: boolean;
};

export type CampaignEncounter = {
  id: string;
  name: string;
  round: number;
  activeTurnIndex: number;
  isActive: boolean;
  participants: CampaignEncounterParticipant[];
  rewards: CampaignEncounterReward[];
  createdAt: string;
  updatedAt: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string;
  characterIds: string[];
  sessionNotes: CampaignNote[];
  npcNotes: CampaignNpc[];
  quests: CampaignQuest[];
  encounters: CampaignEncounter[];
  timelineEntries: CampaignTimelineEntry[];
  timelineEnabled: boolean;
  encounterTools: CampaignEncounterToolPreferences;
  createdAt: string;
  updatedAt: string;
};

