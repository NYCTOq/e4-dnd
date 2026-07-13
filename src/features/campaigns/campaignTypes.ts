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
};

export type CampaignEncounter = {
  id: string;
  name: string;
  round: number;
  activeTurnIndex: number;
  isActive: boolean;
  participants: CampaignEncounterParticipant[];
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
  createdAt: string;
  updatedAt: string;
};
