import { useEffect, useMemo, useState } from "react";
import type { Character } from "../../core/character/character.types";
import { PageShell } from "../../shared/layout/PageShell";
import type { Campaign } from "../campaigns/campaignTypes";
import {
  advanceCampaignDays,
  createCampaignCalendar,
  getDowntimeProgress,
  getUpcomingEvents,
  loadCampaignCalendars,
  saveCampaignCalendars,
  type CalendarEventType,
  type CampaignCalendar,
} from "./campaignCalendarStorage";

type CampaignCalendarPageProps = {
  campaigns: Campaign[];
  characters: Character[];
};

const EVENT_LABELS: Record<CalendarEventType, string> = {
  session: "Oturum",
  travel: "Seyahat",
  deadline: "Son tarih",
  festival: "Festival",
  combat: "Çatışma",
  other: "Diğer",
};

function sortCalendars(calendars: CampaignCalendar[]) {
  return [...calendars].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function CampaignCalendarPage({ campaigns, characters }: CampaignCalendarPageProps) {
  const [calendars, setCalendars] = useState<CampaignCalendar[]>(() => sortCalendars(loadCampaignCalendars()));
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => calendars[0]?.campaignId ?? campaigns[0]?.id ?? "");
  const [advanceDays, setAdvanceDays] = useState(1);

  const selectedCalendar = calendars.find((calendar) => calendar.campaignId === selectedCampaignId) ?? null;
  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);
  const characterMap = useMemo(() => new Map(characters.map((character) => [character.id, character.name])), [characters]);
  const upcomingEvents = selectedCalendar ? getUpcomingEvents(selectedCalendar) : [];

  useEffect(() => saveCampaignCalendars(calendars), [calendars]);

  function ensureCalendar(campaignId: string) {
    setSelectedCampaignId(campaignId);
    if (!campaignId || calendars.some((calendar) => calendar.campaignId === campaignId)) return;
    setCalendars((current) => sortCalendars([createCampaignCalendar(campaignId), ...current]));
  }

  function updateCalendar(updater: (calendar: CampaignCalendar) => CampaignCalendar) {
    if (!selectedCampaignId) return;
    setCalendars((current) => sortCalendars(current.map((calendar) => calendar.campaignId === selectedCampaignId
      ? { ...updater(calendar), updatedAt: new Date().toISOString() }
      : calendar)));
  }

  function createForSelectedCampaign() {
    const campaignId = selectedCampaignId || campaigns[0]?.id || "";
    if (campaignId) ensureCalendar(campaignId);
  }

  return (
    <PageShell
      eyebrow="Dünya zamanı"
      title="Downtime + Campaign Calendar"
      description="Oyun içi günü, önemli tarihleri, seyahatleri ve downtime faaliyetlerini campaign bazında takip et. Zamanın akışı artık DM'in sezgisel tahminlerine bırakılmıyor."
    >
      <section className="calendar-toolbar">
        <label>
          Campaign
          <select value={selectedCampaignId} onChange={(event) => ensureCalendar(event.target.value)}>
            <option value="">Campaign seç</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <div className="calendar-toolbar-summary">
          <strong>{selectedCalendar ? `${selectedCalendar.dayLabel} ${selectedCalendar.currentDay}` : "Takvim yok"}</strong>
          <span>{selectedCalendar?.events.length ?? 0} olay · {selectedCalendar?.activities.length ?? 0} downtime</span>
        </div>
      </section>

      {!selectedCalendar ? (
        <section className="calendar-empty">
          <strong>Bu campaign için henüz takvim oluşturulmadı.</strong>
          <p>Bir campaign seçip oyun içi zamanı, olayları ve karakter faaliyetlerini tek akışta toplamaya başla.</p>
          <button type="button" onClick={createForSelectedCampaign} disabled={!selectedCampaignId && !campaigns.length}>Takvimi oluştur</button>
        </section>
      ) : (
        <>
          <section className="calendar-hero">
            <div>
              <span>{campaignMap.get(selectedCalendar.campaignId) ?? "Campaign"}</span>
              <h2>{selectedCalendar.dayLabel} {selectedCalendar.currentDay}</h2>
              <label>Gün etiketi
                <input value={selectedCalendar.dayLabel} onChange={(event) => updateCalendar((calendar) => ({ ...calendar, dayLabel: event.target.value }))} placeholder="Gün, Deniz Günü, 3A..." />
              </label>
            </div>
            <div className="calendar-advance">
              <label>İlerletilecek gün
                <input type="number" min="1" value={advanceDays} onChange={(event) => setAdvanceDays(Math.max(1, Number(event.target.value) || 1))} />
              </label>
              <button type="button" onClick={() => updateCalendar((calendar) => advanceCampaignDays(calendar, advanceDays))}>Zamanı ilerlet</button>
            </div>
          </section>

          <section className="calendar-grid">
            <article className="calendar-card">
              <header>
                <div><span>Takvim</span><h2>Önemli olaylar</h2></div>
                <button type="button" onClick={() => updateCalendar((calendar) => ({ ...calendar, events: [...calendar.events, { id: crypto.randomUUID(), title: "Yeni olay", day: calendar.currentDay, type: "other", notes: "" }] }))}>+ Olay</button>
              </header>
              <div className="calendar-event-list">
                {selectedCalendar.events.sort((a, b) => a.day - b.day).map((event) => (
                  <div className={event.day < selectedCalendar.currentDay ? "calendar-event past" : "calendar-event"} key={event.id}>
                    <input value={event.title} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, events: calendar.events.map((item) => item.id === event.id ? { ...item, title: change.target.value } : item) }))} />
                    <div className="calendar-event-meta">
                      <label>Gün<input type="number" min="1" value={event.day} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, events: calendar.events.map((item) => item.id === event.id ? { ...item, day: Math.max(1, Number(change.target.value) || 1) } : item) }))} /></label>
                      <label>Tür<select value={event.type} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, events: calendar.events.map((item) => item.id === event.id ? { ...item, type: change.target.value as CalendarEventType } : item) }))}>{Object.entries(EVENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    </div>
                    <textarea value={event.notes} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, events: calendar.events.map((item) => item.id === event.id ? { ...item, notes: change.target.value } : item) }))} placeholder="Olayın etkisi, hazırlık veya sonuç notu..." />
                    <button type="button" className="danger" onClick={() => updateCalendar((calendar) => ({ ...calendar, events: calendar.events.filter((item) => item.id !== event.id) }))}>Sil</button>
                  </div>
                ))}
                {!selectedCalendar.events.length ? <p>Henüz olay eklenmedi.</p> : null}
              </div>
            </article>

            <article className="calendar-card">
              <header>
                <div><span>Karakter zamanı</span><h2>Downtime faaliyetleri</h2></div>
                <button type="button" onClick={() => updateCalendar((calendar) => ({ ...calendar, activities: [...calendar.activities, { id: crypto.randomUUID(), title: "Yeni faaliyet", characterId: characters[0]?.id ?? "", durationDays: 1, completedDays: 0, status: "planned", notes: "" }] }))}>+ Faaliyet</button>
              </header>
              <div className="downtime-list">
                {selectedCalendar.activities.map((activity) => (
                  <div className={`downtime-item ${activity.status}`} key={activity.id}>
                    <input value={activity.title} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.map((item) => item.id === activity.id ? { ...item, title: change.target.value } : item) }))} />
                    <div className="downtime-meta">
                      <select value={activity.characterId} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.map((item) => item.id === activity.id ? { ...item, characterId: change.target.value } : item) }))}>
                        <option value="">Karakter seçilmedi</option>
                        {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                      </select>
                      <label>Süre<input type="number" min="1" value={activity.durationDays} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.map((item) => item.id === activity.id ? { ...item, durationDays: Math.max(1, Number(change.target.value) || 1), completedDays: Math.min(item.completedDays, Math.max(1, Number(change.target.value) || 1)) } : item) }))} /></label>
                    </div>
                    <div className="downtime-progress"><span style={{ width: `${getDowntimeProgress(activity)}%` }} /><em>{activity.completedDays}/{activity.durationDays} gün · {getDowntimeProgress(activity)}%</em></div>
                    <textarea value={activity.notes} onChange={(change) => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.map((item) => item.id === activity.id ? { ...item, notes: change.target.value } : item) }))} placeholder="Crafting, eğitim, araştırma veya iş bağlantıları..." />
                    <div className="downtime-actions">
                      <span>{characterMap.get(activity.characterId) ?? "Atanmamış"}</span>
                      <button type="button" onClick={() => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.map((item) => item.id === activity.id ? { ...item, completedDays: item.durationDays, status: "completed" } : item) }))}>Tamamla</button>
                      <button type="button" className="danger" onClick={() => updateCalendar((calendar) => ({ ...calendar, activities: calendar.activities.filter((item) => item.id !== activity.id) }))}>Sil</button>
                    </div>
                  </div>
                ))}
                {!selectedCalendar.activities.length ? <p>Downtime faaliyeti eklenmedi.</p> : null}
              </div>
            </article>
          </section>

          <section className="calendar-upcoming">
            <header><span>Yaklaşan</span><h2>Sonraki olaylar</h2></header>
            {upcomingEvents.length ? upcomingEvents.map((event) => (
              <div key={event.id}><strong>{selectedCalendar.dayLabel} {event.day}</strong><span>{event.title}</span><em>{EVENT_LABELS[event.type]}</em></div>
            )) : <p>Takvimde yaklaşan olay yok.</p>}
          </section>
        </>
      )}
    </PageShell>
  );
}
