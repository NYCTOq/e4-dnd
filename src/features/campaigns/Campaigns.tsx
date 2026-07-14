import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { rollDice } from "../../core/dice/diceRoller";
import type { Character } from "../../core/character/character.types";
import { getProficiencyBonus } from "../../core/character/characterCalculator";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import type {
  Campaign,
  CampaignEncounter,
  CampaignQuest,
} from "./campaignTypes";
import { getMonsterAbilityModifier } from "../monsters/monsterUtils";
import { EncounterDifficultyPanel } from "./EncounterDifficultyPanel";
import { EncounterCombatRolls } from "./EncounterCombatRolls";
import { EncounterConditionTracker } from "./EncounterConditionTracker";
import { EncounterLootGenerator } from "./EncounterLootGenerator";
import { EncounterToolSettings } from "./EncounterToolSettings";
import { SessionTimeline } from "./SessionTimeline";
import { CampaignDashboard } from "./CampaignDashboard";
import {
  CAMPAIGN_TEMPLATES,
  type CampaignTemplateId,
} from "./campaignTemplates";

export function Campaigns({
  characters,
  campaigns,
  rulesetData,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}: {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  onCreateCampaign: (
    name: string,
    description: string,
    templateId: CampaignTemplateId,
  ) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns[0]?.id ?? null,
  );
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<CampaignTemplateId>("simple");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionBody, setSessionBody] = useState("");
  const [npcName, setNpcName] = useState("");
  const [npcRole, setNpcRole] = useState("");
  const [npcNotes, setNpcNotes] = useState("");
  const [questTitle, setQuestTitle] = useState("");
  const [questNotes, setQuestNotes] = useState("");
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    null,
  );
  const [newEncounterName, setNewEncounterName] = useState("");
  const [monsterToAddId, setMonsterToAddId] = useState("");

  const availableMonsters = rulesetData?.monsters ?? [];

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) {
      setSelectedCampaignId(campaigns[0].id);
      return;
    }

    if (
      selectedCampaignId &&
      !campaigns.some((campaign) => campaign.id === selectedCampaignId)
    ) {
      setSelectedCampaignId(campaigns[0]?.id ?? null);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );

  useEffect(() => {
    if (!selectedCampaign) {
      setSelectedEncounterId(null);
      return;
    }

    if (!selectedEncounterId && selectedCampaign.encounters[0]) {
      setSelectedEncounterId(selectedCampaign.encounters[0].id);
      return;
    }

    if (
      selectedEncounterId &&
      !selectedCampaign.encounters.some(
        (encounter) => encounter.id === selectedEncounterId,
      )
    ) {
      setSelectedEncounterId(selectedCampaign.encounters[0]?.id ?? null);
    }
  }, [selectedCampaign, selectedEncounterId]);

  const partyCharacters = useMemo(() => {
    if (!selectedCampaign) {
      return [];
    }

    return selectedCampaign.characterIds
      .map((id) => characters.find((character) => character.id === id))
      .filter((character): character is Character => Boolean(character));
  }, [characters, selectedCampaign]);

  const partySummary = useMemo(() => {
    const totalHp = partyCharacters.reduce(
      (sum, character) => sum + character.currentHp,
      0,
    );
    const totalMaxHp = partyCharacters.reduce(
      (sum, character) => sum + character.maxHp,
      0,
    );
    const averageLevel =
      partyCharacters.length === 0
        ? 0
        : partyCharacters.reduce((sum, character) => sum + character.level, 0) /
          partyCharacters.length;

    return {
      totalHp,
      totalMaxHp,
      averageLevel,
    };
  }, [partyCharacters]);

  const selectedEncounter = selectedCampaign?.encounters.find(
    (encounter) => encounter.id === selectedEncounterId,
  );

  const sortedEncounterParticipants = useMemo(() => {
    if (!selectedEncounter) {
      return [];
    }

    return [...selectedEncounter.participants].sort((first, second) => {
      const firstInitiative = first.initiative ?? -999;
      const secondInitiative = second.initiative ?? -999;

      if (secondInitiative !== firstInitiative) {
        return secondInitiative - firstInitiative;
      }

      return second.initiativeModifier - first.initiativeModifier;
    });
  }, [selectedEncounter]);

  const activeEncounterParticipant =
    sortedEncounterParticipants[selectedEncounter?.activeTurnIndex ?? 0] ?? null;

  function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newCampaignName.trim()) {
      alert(
        "Campaign adı lazım kankam. Adsız kampanya biraz vergi dairesi dosyası gibi duruyor.",
      );
      return;
    }

    onCreateCampaign(
      newCampaignName.trim(),
      newCampaignDescription.trim(),
      selectedTemplateId,
    );
    setNewCampaignName("");
    setNewCampaignDescription("");
  }

  function toggleCampaignCharacter(characterId: string) {
    if (!selectedCampaign) {
      return;
    }

    const hasCharacter = selectedCampaign.characterIds.includes(characterId);

    onUpdateCampaign({
      ...selectedCampaign,
      characterIds: hasCharacter
        ? selectedCampaign.characterIds.filter((id) => id !== characterId)
        : [...selectedCampaign.characterIds, characterId],
      updatedAt: new Date().toISOString(),
    });
  }

  function addSessionNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !sessionTitle.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      sessionNotes: [
        {
          id: crypto.randomUUID(),
          title: sessionTitle.trim(),
          body: sessionBody.trim(),
          createdAt: now,
        },
        ...selectedCampaign.sessionNotes,
      ],
      updatedAt: now,
    });

    setSessionTitle("");
    setSessionBody("");
  }

  function addNpc(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !npcName.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      npcNotes: [
        {
          id: crypto.randomUUID(),
          name: npcName.trim(),
          role: npcRole.trim() || "NPC",
          notes: npcNotes.trim(),
          createdAt: now,
        },
        ...selectedCampaign.npcNotes,
      ],
      updatedAt: now,
    });

    setNpcName("");
    setNpcRole("");
    setNpcNotes("");
  }

  function addQuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !questTitle.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      quests: [
        {
          id: crypto.randomUUID(),
          title: questTitle.trim(),
          status: "active",
          notes: questNotes.trim(),
          createdAt: now,
        },
        ...selectedCampaign.quests,
      ],
      updatedAt: now,
    });

    setQuestTitle("");
    setQuestNotes("");
  }

  function updateQuestStatus(questId: string, status: CampaignQuest["status"]) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      quests: selectedCampaign.quests.map((quest) =>
        quest.id === questId ? { ...quest, status } : quest,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function removeFromCampaign(
    collection: "sessionNotes" | "npcNotes" | "quests",
    id: string,
  ) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      [collection]: selectedCampaign[collection].filter(
        (item) => item.id !== id,
      ),
      updatedAt: new Date().toISOString(),
    });
  }


  function updateTimelineEntries(entries: Campaign["timelineEntries"]) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      timelineEntries: entries,
      updatedAt: new Date().toISOString(),
    });
  }

  function toggleTimelineEnabled(enabled: boolean) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      timelineEnabled: enabled,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateEncounterTools(
    encounterTools: Campaign["encounterTools"],
  ) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      encounterTools,
      updatedAt: new Date().toISOString(),
    });
  }

  function createEncounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign) {
      return;
    }

    const now = new Date().toISOString();
    const encounter: CampaignEncounter = {
      id: crypto.randomUUID(),
      name: newEncounterName.trim() || `Encounter ${selectedCampaign.encounters.length + 1}`,
      round: 1,
      activeTurnIndex: 0,
      isActive: true,
      participants: [],
      rewards: [],
      createdAt: now,
      updatedAt: now,
    };

    onUpdateCampaign({
      ...selectedCampaign,
      encounters: [encounter, ...selectedCampaign.encounters],
      updatedAt: now,
    });

    setSelectedEncounterId(encounter.id);
    setNewEncounterName("");
  }

  function updateSelectedEncounter(
    updater: (encounter: CampaignEncounter) => CampaignEncounter,
  ) {
    if (!selectedCampaign || !selectedEncounter) {
      return;
    }

    const updatedEncounter = updater(selectedEncounter);
    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      encounters: selectedCampaign.encounters.map((encounter) =>
        encounter.id === selectedEncounter.id
          ? {
              ...updatedEncounter,
              updatedAt: now,
            }
          : encounter,
      ),
      updatedAt: now,
    });
  }

  function deleteEncounter(encounterId: string) {
    if (!selectedCampaign) {
      return;
    }

    const confirmed = confirm(
      "Bu encounter silinsin mi? Goblin sendikası buna bozulabilir.",
    );

    if (!confirmed) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      encounters: selectedCampaign.encounters.filter(
        (encounter) => encounter.id !== encounterId,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function addCharacterToEncounter(character: Character) {
    if (!selectedEncounter) {
      return;
    }

    const alreadyAdded = selectedEncounter.participants.some(
      (participant) =>
        participant.sourceType === "character" &&
        participant.sourceId === character.id,
    );

    if (alreadyAdded) {
      return;
    }

    const dexModifier = getMonsterAbilityModifier(character.abilities.dex);

    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: [
        ...encounter.participants,
        {
          id: crypto.randomUUID(),
          sourceType: "character",
          sourceId: character.id,
          name: character.name,
          armorClass: character.armorClass,
          maxHp: character.maxHp,
          currentHp: character.currentHp,
          initiative: null,
          initiativeModifier: dexModifier,
          notes: `${character.race || "Race yok"} • ${
            character.className || "Class yok"
          }`,
          conditions: [],
        },
      ],
    }));
  }

  function addMonsterToEncounter() {
    if (!selectedEncounter || !monsterToAddId) {
      return;
    }

    const monster = availableMonsters.find((item) => item.id === monsterToAddId);

    if (!monster) {
      return;
    }

    const dexModifier = getMonsterAbilityModifier(monster.abilities.dex);

    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: [
        ...encounter.participants,
        {
          id: crypto.randomUUID(),
          sourceType: "monster",
          sourceId: monster.id,
          name: monster.name,
          armorClass: monster.armorClass,
          maxHp: monster.hitPoints,
          currentHp: monster.hitPoints,
          initiative: null,
          initiativeModifier: dexModifier,
          notes: `${monster.size} ${monster.type} • CR ${monster.challengeRating}`,
          conditions: [],
        },
      ],
    }));
  }

  function updateEncounterParticipantHp(participantId: string, amount: number) {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: encounter.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              currentHp: Math.max(
                0,
                Math.min(participant.maxHp, participant.currentHp + amount),
              ),
            }
          : participant,
      ),
    }));
  }

  function addEncounterCondition(
    participantId: string,
    name: string,
    remainingRounds: number | null,
  ) {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: encounter.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              conditions: [
                ...participant.conditions,
                { id: crypto.randomUUID(), name, remainingRounds },
              ],
            }
          : participant,
      ),
    }));
  }

  function removeEncounterCondition(participantId: string, conditionId: string) {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: encounter.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              conditions: participant.conditions.filter(
                (condition) => condition.id !== conditionId,
              ),
            }
          : participant,
      ),
    }));
  }

  function changeEncounterConditionRounds(
    participantId: string,
    conditionId: string,
    remainingRounds: number | null,
  ) {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: encounter.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              conditions: participant.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, remainingRounds }
                  : condition,
              ),
            }
          : participant,
      ),
    }));
  }

  function removeEncounterParticipant(participantId: string) {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      participants: encounter.participants.filter(
        (participant) => participant.id !== participantId,
      ),
      activeTurnIndex: Math.min(
        encounter.activeTurnIndex,
        Math.max(0, encounter.participants.length - 2),
      ),
    }));
  }

  function rollEncounterInitiative() {
    updateSelectedEncounter((encounter) => {
      const rolledParticipants = encounter.participants.map((participant) => {
        const result = rollDice({
          count: 1,
          sides: 20,
          modifier: participant.initiativeModifier,
        });

        return {
          ...participant,
          initiative: result.total,
        };
      });

      return {
        ...encounter,
        round: 1,
        activeTurnIndex: 0,
        isActive: true,
        participants: rolledParticipants.sort((first, second) => {
          const firstInitiative = first.initiative ?? -999;
          const secondInitiative = second.initiative ?? -999;

          if (secondInitiative !== firstInitiative) {
            return secondInitiative - firstInitiative;
          }

          return second.initiativeModifier - first.initiativeModifier;
        }),
      };
    });
  }

  function nextEncounterTurn() {
    updateSelectedEncounter((encounter) => {
      if (encounter.participants.length === 0) {
        return encounter;
      }

      const nextTurnIndex = encounter.activeTurnIndex + 1;
      const shouldAdvanceRound = nextTurnIndex >= encounter.participants.length;

      return {
        ...encounter,
        activeTurnIndex: shouldAdvanceRound ? 0 : nextTurnIndex,
        round: shouldAdvanceRound ? encounter.round + 1 : encounter.round,
        isActive: true,
        participants: shouldAdvanceRound
          ? encounter.participants.map((participant) => ({
              ...participant,
              conditions: participant.conditions
                .map((condition) =>
                  condition.remainingRounds === null
                    ? condition
                    : {
                        ...condition,
                        remainingRounds: condition.remainingRounds - 1,
                      },
                )
                .filter(
                  (condition) =>
                    condition.remainingRounds === null ||
                    condition.remainingRounds > 0,
                ),
            }))
          : encounter.participants,
      };
    });
  }

  function resetEncounter() {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      round: 1,
      activeTurnIndex: 0,
      isActive: true,
      participants: encounter.participants.map((participant) => ({
        ...participant,
        currentHp: participant.maxHp,
        initiative: null,
      })),
    }));
  }

  function toggleEncounterActive() {
    updateSelectedEncounter((encounter) => ({
      ...encounter,
      isActive: !encounter.isActive,
    }));
  }

  return (
    <PageShell
      eyebrow="Campaign Command Center"
      title="Campaigns"
      description="Parti, session notları, NPC kayıtları ve quest takibi. DM kaosunu en azından kartlara ayırıyoruz. Medeniyet dediğin bu kadar kırılgan."
    >
      <div className="campaign-layout">
        <aside className="campaign-sidebar-card">
          <form className="campaign-create-form" onSubmit={createCampaign}>
            <span className="mini-label">New Campaign</span>
            <input
              value={newCampaignName}
              onChange={(event) => setNewCampaignName(event.target.value)}
              placeholder="Alabasta Arc"
            />
            <textarea
              value={newCampaignDescription}
              onChange={(event) =>
                setNewCampaignDescription(event.target.value)
              }
              placeholder="Kampanya kısa açıklaması..."
              rows={3}
            />
            <div className="campaign-template-picker" role="radiogroup" aria-label="Campaign şablonu">
              {CAMPAIGN_TEMPLATES.map((template) => (
                <button
                  aria-checked={selectedTemplateId === template.id}
                  className={
                    selectedTemplateId === template.id
                      ? "campaign-template-option active"
                      : "campaign-template-option"
                  }
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  role="radio"
                  type="button"
                >
                  <span>{template.eyebrow}</span>
                  <strong>{template.name}</strong>
                  <small>{template.description}</small>
                  <em>{template.highlights.join(" • ")}</em>
                </button>
              ))}
            </div>
            <button className="primary-action" type="submit">
              Campaign Oluştur
            </button>
          </form>

          <div className="campaign-list">
            {campaigns.length === 0 ? (
              <div className="empty-panel compact-empty">
                <h2>Campaign yok.</h2>
                <p>
                  Henüz kimse dünyayı kurtarmaya kalkmamış. Şaşırtıcı ölçüde
                  huzurlu.
                </p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <button
                  className={
                    campaign.id === selectedCampaignId
                      ? "campaign-list-item active"
                      : "campaign-list-item"
                  }
                  key={campaign.id}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <strong>{campaign.name}</strong>
                  <span>{campaign.characterIds.length} karakter</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {!selectedCampaign ? (
          <div className="empty-panel campaign-empty-main">
            <h2>Bir campaign seç.</h2>
            <p>
              Sol taraftan kampanya oluştur veya seç. Evet, organizasyon diye
              bir kavram hâlâ var.
            </p>
          </div>
        ) : (
          <div className="campaign-main">
            <section className="campaign-hero-card">
              <div>
                <span className="mini-label">Active Campaign</span>
                <h2>{selectedCampaign.name}</h2>
                <p>
                  {selectedCampaign.description ||
                    "Açıklama yok. Gizemli kampanya mı, unutkan DM mi, bunu tarih yazacak."}
                </p>
              </div>

              <button
                className="danger-action"
                onClick={() => onDeleteCampaign(selectedCampaign.id)}
              >
                Campaign Sil
              </button>
            </section>

            <section className="campaign-stat-grid">
              <div>
                <span>Party Size</span>
                <strong>{partyCharacters.length}</strong>
              </div>
              <div>
                <span>Party HP</span>
                <strong>
                  {partySummary.totalHp}/{partySummary.totalMaxHp}
                </strong>
              </div>
              <div>
                <span>Average Level</span>
                <strong>{partySummary.averageLevel.toFixed(1)}</strong>
              </div>
              <div>
                <span>Active Quests</span>
                <strong>
                  {
                    selectedCampaign.quests.filter(
                      (quest) => quest.status === "active",
                    ).length
                  }
                </strong>
              </div>
            </section>

            <CampaignDashboard
              campaign={selectedCampaign}
              partyCharacters={partyCharacters}
              selectedEncounter={selectedEncounter}
            />

            <div id="campaign-timeline" className="campaign-scroll-anchor">
            <SessionTimeline
              entries={selectedCampaign.timelineEntries}
              enabled={selectedCampaign.timelineEnabled}
              draftKey={`e4_dnd_draft_timeline_${selectedCampaign.id}_v1`}
              onToggleEnabled={toggleTimelineEnabled}
              onChange={updateTimelineEntries}
            />
            </div>

            <section id="campaign-encounters" className="campaign-card encounter-tracker-card campaign-scroll-anchor">
              <div className="campaign-section-head">
                <div>
                  <span className="mini-label">Encounter Tracker</span>
                  <h2>Encounter Yönetimi</h2>
                </div>
              </div>

              <div className="encounter-layout">
                <aside className="encounter-sidebar">
                  <form className="campaign-mini-form" onSubmit={createEncounter}>
                    <input
                      value={newEncounterName}
                      onChange={(event) => setNewEncounterName(event.target.value)}
                      placeholder="Rainbase Ambush"
                    />
                    <button className="primary-action" type="submit">
                      Encounter Oluştur
                    </button>
                  </form>

                  <div className="encounter-list">
                    {selectedCampaign.encounters.length === 0 ? (
                      <div className="empty-panel compact-empty">
                        <h2>Encounter yok.</h2>
                        <p>
                          Henüz kimse kimseye saldırmıyor. D&D için şüpheli
                          derecede sağlıklı.
                        </p>
                      </div>
                    ) : (
                      selectedCampaign.encounters.map((encounter) => (
                        <button
                          className={
                            encounter.id === selectedEncounterId
                              ? "encounter-list-item active"
                              : "encounter-list-item"
                          }
                          key={encounter.id}
                          onClick={() => setSelectedEncounterId(encounter.id)}
                        >
                          <strong>{encounter.name}</strong>
                          <span>
                            Round {encounter.round} •{" "}
                            {encounter.participants.length} participant
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </aside>

                {!selectedEncounter ? (
                  <div className="empty-panel encounter-empty">
                    <h2>Bir encounter seç veya oluştur.</h2>
                    <p>
                      Canavarları savaşa sokmadan önce küçük bir form dolduruyoruz.
                      Bürokrasi fantastik evrenlere de bulaştı.
                    </p>
                  </div>
                ) : (
                  <div className="encounter-main">
                    <div className="encounter-hero">
                      <div>
                        <span className="mini-label">
                          {selectedEncounter.isActive ? "Active" : "Paused"}
                        </span>
                        <h2>{selectedEncounter.name}</h2>
                        <p>
                          Round {selectedEncounter.round}
                          {activeEncounterParticipant
                            ? ` • Sıradaki: ${activeEncounterParticipant.name}`
                            : " • Henüz initiative yok"}
                        </p>
                      </div>

                      <div className="encounter-action-row">
                        <button type="button" onClick={rollEncounterInitiative}>
                          Initiative Roll
                        </button>
                        <button type="button" onClick={nextEncounterTurn}>
                          Next Turn
                        </button>
                        <button type="button" onClick={toggleEncounterActive}>
                          {selectedEncounter.isActive ? "Pause" : "Resume"}
                        </button>
                        <button type="button" onClick={resetEncounter}>
                          Reset
                        </button>
                        <button
                          className="danger-action compact-danger"
                          type="button"
                          onClick={() => deleteEncounter(selectedEncounter.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>

                    <EncounterToolSettings
                      value={selectedCampaign.encounterTools}
                      onChange={updateEncounterTools}
                    />

                    {selectedCampaign.encounterTools.difficulty ? (
                      <EncounterDifficultyPanel
                      encounter={selectedEncounter}
                      campaignParty={partyCharacters}
                      monsters={availableMonsters}
                      />
                    ) : null}

                    {selectedCampaign.encounterTools.loot ? (
                      <EncounterLootGenerator
                      encounter={selectedEncounter}
                      monsters={availableMonsters}
                      items={rulesetData?.items ?? []}
                      onChange={(rewards) =>
                        updateSelectedEncounter((encounter) => ({
                          ...encounter,
                          rewards,
                        }))
                      }
                      />
                    ) : null}

                    <div className="encounter-add-grid">
                      <section className="encounter-add-card">
                        <span className="mini-label">Party</span>
                        <h3>Karakter Ekle</h3>
                        {partyCharacters.length === 0 ? (
                          <p>Önce party'ye karakter bağla. Savaş boş sandalyelerle dönmüyor.</p>
                        ) : (
                          <div className="encounter-pick-list">
                            {partyCharacters.map((character) => (
                              <button
                                key={character.id}
                                type="button"
                                onClick={() => addCharacterToEncounter(character)}
                              >
                                {character.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="encounter-add-card">
                        <span className="mini-label">Monsters / NPCs</span>
                        <h3>Monster Ekle</h3>
                        <div className="encounter-monster-picker">
                          <select
                            value={monsterToAddId}
                            onChange={(event) => setMonsterToAddId(event.target.value)}
                          >
                            <option value="">Monster seç</option>
                            {availableMonsters.map((monster) => (
                              <option key={monster.id} value={monster.id}>
                                {monster.name} • CR {monster.challengeRating}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={addMonsterToEncounter}>
                            Ekle
                          </button>
                        </div>
                      </section>
                    </div>

                    {selectedEncounter.participants.length === 0 ? (
                      <div className="empty-panel compact-empty">
                        <h2>Participant yok.</h2>
                        <p>
                          Encounter var ama içinde kimse yok. Bu da teknik olarak
                          toplantı, savaş değil.
                        </p>
                      </div>
                    ) : (
                      <div className="encounter-turn-list">
                        {sortedEncounterParticipants.map((participant, index) => {
                          const isActiveTurn =
                            selectedEncounter.activeTurnIndex === index;
                          const hpPercent =
                            participant.maxHp > 0
                              ? Math.round(
                                  (participant.currentHp / participant.maxHp) * 100,
                                )
                              : 0;

                          return (
                            <article
                              className={
                                isActiveTurn
                                  ? "encounter-participant-card active-turn"
                                  : "encounter-participant-card"
                              }
                              key={participant.id}
                            >
                              <div className="encounter-participant-head">
                                <div>
                                  <span className="mini-label">
                                    {participant.sourceType === "character"
                                      ? "Character"
                                      : "Monster / NPC"}
                                  </span>
                                  <h3>{participant.name}</h3>
                                  <p>{participant.notes}</p>
                                </div>

                                <div className="initiative-badge">
                                  <span>Init</span>
                                  <strong>
                                    {participant.initiative ?? "—"}
                                  </strong>
                                  <em>
                                    {participant.initiativeModifier >= 0
                                      ? `+${participant.initiativeModifier}`
                                      : participant.initiativeModifier}
                                  </em>
                                </div>
                              </div>

                              <div className="encounter-stat-row">
                                <span>AC {participant.armorClass}</span>
                                <span>
                                  HP {participant.currentHp}/{participant.maxHp}
                                </span>
                                <span>{hpPercent}%</span>
                              </div>

                              <div className="encounter-hp-bar">
                                <div style={{ width: `${hpPercent}%` }} />
                              </div>

                              <div className="hp-button-grid monster-hp-grid">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, -10)
                                  }
                                >
                                  -10
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, -5)
                                  }
                                >
                                  -5
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, -1)
                                  }
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, 1)
                                  }
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, 5)
                                  }
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEncounterParticipantHp(participant.id, 10)
                                  }
                                >
                                  +10
                                </button>
                              </div>

                              {selectedCampaign.encounterTools.conditions ? (
                                <EncounterConditionTracker
                                  participant={participant}
                                onAdd={(name, remainingRounds) =>
                                  addEncounterCondition(
                                    participant.id,
                                    name,
                                    remainingRounds,
                                  )
                                }
                                onRemove={(conditionId) =>
                                  removeEncounterCondition(
                                    participant.id,
                                    conditionId,
                                  )
                                }
                                onChangeRounds={(conditionId, remainingRounds) =>
                                  changeEncounterConditionRounds(
                                    participant.id,
                                    conditionId,
                                    remainingRounds,
                                  )
                                }
                                />
                              ) : null}

                              {selectedCampaign.encounterTools.combatRolls ? (
                                <EncounterCombatRolls
                                participant={participant}
                                character={
                                  participant.sourceType === "character"
                                    ? characters.find(
                                        (character) =>
                                          character.id === participant.sourceId,
                                      )
                                    : undefined
                                }
                                monster={
                                  participant.sourceType === "monster"
                                    ? availableMonsters.find(
                                        (monster) =>
                                          monster.id === participant.sourceId,
                                      )
                                    : undefined
                                }
                                items={rulesetData?.items ?? []}
                                />
                              ) : null}

                              <button
                                className="danger-action compact-danger"
                                type="button"
                                onClick={() =>
                                  removeEncounterParticipant(participant.id)
                                }
                              >
                                Participant Sil
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section id="campaign-party" className="campaign-card campaign-scroll-anchor">
              <div className="campaign-section-head">
                <div>
                  <span className="mini-label">Party</span>
                  <h2>Karakterleri Bağla</h2>
                </div>
              </div>

              {characters.length === 0 ? (
                <div className="empty-panel compact-empty">
                  <h2>Karakter yok.</h2>
                  <p>
                    Önce karakter oluştur. Parti boşsa macera da biraz
                    PowerPoint sunumu gibi kalıyor.
                  </p>
                </div>
              ) : (
                <div className="campaign-character-grid">
                  {characters.map((character) => {
                    const selected = selectedCampaign.characterIds.includes(
                      character.id,
                    );

                    return (
                      <button
                        className={
                          selected
                            ? "campaign-character-pill active"
                            : "campaign-character-pill"
                        }
                        key={character.id}
                        onClick={() => toggleCampaignCharacter(character.id)}
                      >
                        <strong>{character.name}</strong>
                        <span>
                          Lv. {character.level} •{" "}
                          {character.className || "Class yok"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div id="campaign-records" className="campaign-grid-two campaign-scroll-anchor">
              <section className="campaign-card">
                <div className="campaign-section-head">
                  <div>
                    <span className="mini-label">Party Dashboard</span>
                    <h2>Aktif Parti</h2>
                  </div>
                </div>

                {partyCharacters.length === 0 ? (
                  <div className="empty-panel compact-empty">
                    <h2>Parti boş.</h2>
                    <p>Henüz kimse bu felakete dahil edilmemiş.</p>
                  </div>
                ) : (
                  <div className="party-character-list">
                    {partyCharacters.map((character) => (
                      <article
                        className="party-character-card"
                        key={character.id}
                      >
                        <div>
                          <strong>{character.name}</strong>
                          <span>
                            {character.race || "Race yok"} •{" "}
                            {character.className || "Class yok"}
                          </span>
                        </div>
                        <div>
                          <b>
                            HP {character.currentHp}/{character.maxHp}
                          </b>
                          <span>
                            AC {character.armorClass} • PB +
                            {getProficiencyBonus(character.level)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addSessionNote}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">Session Notes</span>
                      <h2>Oturum Notu</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <input
                    value={sessionTitle}
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="Session 4 - Rainbase"
                  />
                  <textarea
                    value={sessionBody}
                    onChange={(event) => setSessionBody(event.target.value)}
                    placeholder="Bu oturumda ne oldu? Kim kimi kandırdı? Kim gereksiz risk aldı?"
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.sessionNotes.map((note) => (
                    <article className="campaign-note-card" key={note.id}>
                      <div>
                        <strong>{note.title}</strong>
                        <p>
                          {note.body ||
                            "Not boş. Minimalizm mi üşengeçlik mi, bilemedim."}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          removeFromCampaign("sessionNotes", note.id)
                        }
                      >
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="campaign-grid-two">
              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addNpc}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">NPC Notes</span>
                      <h2>NPC Ekle</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <div className="form-grid compact-form-grid">
                    <input
                      value={npcName}
                      onChange={(event) => setNpcName(event.target.value)}
                      placeholder="NPC adı"
                    />
                    <input
                      value={npcRole}
                      onChange={(event) => setNpcRole(event.target.value)}
                      placeholder="Rol / Ünvan"
                    />
                  </div>
                  <textarea
                    value={npcNotes}
                    onChange={(event) => setNpcNotes(event.target.value)}
                    placeholder="NPC notları, motivasyon, ses tonu, şüpheli davranışlar..."
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.npcNotes.map((npc) => (
                    <article className="campaign-note-card" key={npc.id}>
                      <div>
                        <strong>{npc.name}</strong>
                        <span>{npc.role}</span>
                        <p>
                          {npc.notes ||
                            "Not yok. NPC de düz vatandaş çıktı, üzücü."}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCampaign("npcNotes", npc.id)}
                      >
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addQuest}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">Quest Tracker</span>
                      <h2>Quest Ekle</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <input
                    value={questTitle}
                    onChange={(event) => setQuestTitle(event.target.value)}
                    placeholder="Vivi'yi kurtar"
                  />
                  <textarea
                    value={questNotes}
                    onChange={(event) => setQuestNotes(event.target.value)}
                    placeholder="Quest detayları..."
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.quests.map((quest) => (
                    <article className="campaign-note-card" key={quest.id}>
                      <div>
                        <strong>{quest.title}</strong>
                        <span>{quest.status}</span>
                        <p>
                          {quest.notes ||
                            "Not yok. Görev tanımı bile performans kaygısı yaşıyor."}
                        </p>
                        <div className="quest-status-row">
                          {(["active", "completed", "failed"] as const).map(
                            (status) => (
                              <button
                                className={
                                  quest.status === status ? "active" : ""
                                }
                                key={status}
                                onClick={() =>
                                  updateQuestStatus(quest.id, status)
                                }
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCampaign("quests", quest.id)}
                      >
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
