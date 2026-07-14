import type { Character } from "../../core/character/character.types";
import type { Campaign, CampaignEncounter } from "./campaignTypes";

function formatDate(value?: string) {
  if (!value) return "Kayıt yok";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CampaignDashboard({
  campaign,
  partyCharacters,
  selectedEncounter,
}: {
  campaign: Campaign;
  partyCharacters: Character[];
  selectedEncounter?: CampaignEncounter;
}) {
  const activeQuests = campaign.quests.filter((quest) => quest.status === "active");
  const completedQuests = campaign.quests.filter(
    (quest) => quest.status === "completed",
  );
  const activeEncounter =
    selectedEncounter ?? campaign.encounters.find((encounter) => encounter.isActive);
  const latestTimelineEntry = [...campaign.timelineEntries].sort((first, second) =>
    second.sessionDate.localeCompare(first.sessionDate),
  )[0];
  const latestSessionNote = campaign.sessionNotes[0];
  const totalRewards = campaign.encounters.reduce(
    (sum, encounter) => sum + encounter.rewards.length,
    0,
  );
  const totalRewardValue = campaign.encounters.reduce(
    (sum, encounter) =>
      sum +
      encounter.rewards.reduce(
        (encounterSum, reward) =>
          encounterSum + reward.valueGp * Math.max(1, reward.quantity),
        0,
      ),
    0,
  );
  const woundedCharacters = partyCharacters.filter(
    (character) => character.currentHp < character.maxHp,
  );
  const criticalCharacters = partyCharacters.filter(
    (character) =>
      character.maxHp > 0 && character.currentHp / character.maxHp <= 0.25,
  );
  const openConditions = activeEncounter?.participants.reduce(
    (sum, participant) => sum + participant.conditions.length,
    0,
  ) ?? 0;

  return (
    <section className="campaign-overview" aria-label="Campaign overview">
      <div className="campaign-overview-head">
        <div>
          <span className="mini-label">Command Overview</span>
          <h2>Campaign Özeti</h2>
          <p>
            Parti, encounter ve hikâye kayıtlarının tek bakışlık özeti. DM’in
            sekiz farklı karta bakıp zihinsel tablo kurmasına gerek kalmasın.
          </p>
        </div>
        <span className="campaign-overview-updated">
          Son güncelleme: {formatDate(campaign.updatedAt)}
        </span>
      </div>

      <div className="campaign-overview-grid">
        <article className="campaign-overview-card party-overview-card">
          <div className="campaign-overview-card-head">
            <span className="mini-label">Party Status</span>
            <button type="button" onClick={() => scrollToSection("campaign-party")}> 
              Partiye Git
            </button>
          </div>
          <strong className="campaign-overview-value">{partyCharacters.length}</strong>
          <span className="campaign-overview-caption">aktif karakter</span>
          <div className="campaign-overview-metrics">
            <span>{woundedCharacters.length} yaralı</span>
            <span className={criticalCharacters.length > 0 ? "warning" : ""}>
              {criticalCharacters.length} kritik
            </span>
          </div>
        </article>

        <article className="campaign-overview-card encounter-overview-card">
          <div className="campaign-overview-card-head">
            <span className="mini-label">Active Encounter</span>
            <button
              type="button"
              onClick={() => scrollToSection("campaign-encounters")}
            >
              Encounter’a Git
            </button>
          </div>
          {activeEncounter ? (
            <>
              <strong className="campaign-overview-title">
                {activeEncounter.name}
              </strong>
              <span className="campaign-overview-caption">
                Round {activeEncounter.round} • {activeEncounter.participants.length} participant
              </span>
              <div className="campaign-overview-metrics">
                <span>{activeEncounter.isActive ? "Devam ediyor" : "Duraklatıldı"}</span>
                <span>{openConditions} condition</span>
              </div>
            </>
          ) : (
            <p className="campaign-overview-empty">Aktif encounter bulunmuyor.</p>
          )}
        </article>

        <article className="campaign-overview-card quest-overview-card">
          <div className="campaign-overview-card-head">
            <span className="mini-label">Quest Pulse</span>
            <button type="button" onClick={() => scrollToSection("campaign-records")}> 
              Questlere Git
            </button>
          </div>
          <strong className="campaign-overview-value">{activeQuests.length}</strong>
          <span className="campaign-overview-caption">aktif quest</span>
          <div className="campaign-overview-metrics">
            <span>{completedQuests.length} tamamlandı</span>
            <span>{campaign.quests.length} toplam</span>
          </div>
        </article>

        <article className="campaign-overview-card story-overview-card">
          <div className="campaign-overview-card-head">
            <span className="mini-label">Latest Story Beat</span>
            <button type="button" onClick={() => scrollToSection("campaign-timeline")}> 
              Timeline’a Git
            </button>
          </div>
          {latestTimelineEntry || latestSessionNote ? (
            <>
              <strong className="campaign-overview-title">
                {latestTimelineEntry?.title ?? latestSessionNote?.title}
              </strong>
              <span className="campaign-overview-caption">
                {latestTimelineEntry
                  ? formatDate(latestTimelineEntry.sessionDate)
                  : formatDate(latestSessionNote?.createdAt)}
              </span>
              <p className="campaign-overview-preview">
                {latestTimelineEntry?.summary ||
                  latestSessionNote?.body ||
                  "Detay eklenmemiş."}
              </p>
            </>
          ) : (
            <p className="campaign-overview-empty">Henüz hikâye kaydı yok.</p>
          )}
        </article>

        <article className="campaign-overview-card loot-overview-card">
          <div className="campaign-overview-card-head">
            <span className="mini-label">Loot Ledger</span>
            <button
              type="button"
              onClick={() => scrollToSection("campaign-encounters")}
            >
              Loot’a Git
            </button>
          </div>
          <strong className="campaign-overview-value">{totalRewards}</strong>
          <span className="campaign-overview-caption">kayıtlı ödül</span>
          <div className="campaign-overview-metrics">
            <span>{Math.round(totalRewardValue)} GP değer</span>
            <span>{campaign.encounters.length} encounter</span>
          </div>
        </article>
      </div>
    </section>
  );
}
