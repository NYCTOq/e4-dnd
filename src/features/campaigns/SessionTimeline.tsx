import { useMemo, useState } from "react";
import { AutosaveStatus } from "../../shared/forms/AutosaveStatus";
import { useAutosavedDraft } from "../../shared/state/useAutosavedDraft";
import type * as React from "react";
import type { CampaignTimelineEntry } from "./campaignTypes";

type TimelineDraft = Omit<CampaignTimelineEntry, "id" | "createdAt" | "updatedAt">;

const emptyDraft = (): TimelineDraft => ({
  title: "",
  sessionDate: new Date().toISOString().slice(0, 10),
  summary: "",
  events: [],
  npcs: [],
  questUpdates: [],
  loot: [],
  casualties: [],
  notes: "",
});

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function listText(items: string[]) {
  return items.join("\n");
}

export function SessionTimeline({
  entries,
  enabled,
  draftKey,
  onToggleEnabled,
  onChange,
}: {
  entries: CampaignTimelineEntry[];
  enabled: boolean;
  draftKey: string;
  onToggleEnabled: (enabled: boolean) => void;
  onChange: (entries: CampaignTimelineEntry[]) => void;
}) {
  const {
    value: draft,
    setValue: setDraft,
    clearDraft,
    lastSavedAt,
    restoredAt,
  } = useAutosavedDraft<TimelineDraft>(draftKey, emptyDraft, {
    isMeaningful: (value) =>
      Boolean(
        value.title.trim() ||
          value.summary.trim() ||
          value.notes.trim() ||
          value.events.length ||
          value.npcs.length ||
          value.questUpdates.length ||
          value.loot.length ||
          value.casualties.length,
      ),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)),
    [entries],
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      onChange(entries.map((entry) => entry.id === editingId ? {
        ...entry,
        ...draft,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        notes: draft.notes.trim(),
        updatedAt: now,
      } : entry));
    } else {
      onChange([{
        id: crypto.randomUUID(),
        ...draft,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        notes: draft.notes.trim(),
        createdAt: now,
        updatedAt: now,
      }, ...entries]);
    }
    setEditingId(null);
    clearDraft(emptyDraft());
  }

  function edit(entry: CampaignTimelineEntry) {
    setEditingId(entry.id);
    setDraft({
      title: entry.title,
      sessionDate: entry.sessionDate,
      summary: entry.summary,
      events: entry.events,
      npcs: entry.npcs,
      questUpdates: entry.questUpdates,
      loot: entry.loot,
      casualties: entry.casualties,
      notes: entry.notes,
    });
  }

  function remove(id: string) {
    if (confirm("Bu timeline kaydÄ± silinsin mi? Tarih yine kazananlarÄ±n eline kalacak.")) {
      onChange(entries.filter((entry) => entry.id !== id));
      if (editingId === id) {
        setEditingId(null);
        clearDraft(emptyDraft());
      }
    }
  }

  return (
    <section className="campaign-card session-timeline-card">
      <div className="campaign-section-head timeline-section-head">
        <div>
          <span className="mini-label">Optional Campaign Module</span>
          <h2>Session Timeline</h2>
          <p>OturumlarÄ±n kronolojik Ã¶zeti. Ã‡Ã¼nkÃ¼ â€œgeÃ§en sefer ne olmuÅŸtu?â€ sorusu evrensel bir lanet.</p>
        </div>
        <button type="button" className={enabled ? "timeline-toggle active" : "timeline-toggle"} onClick={() => onToggleEnabled(!enabled)}>
          {enabled ? "Timeline AÃ§Ä±k" : "Timeline KapalÄ±"}
        </button>
      </div>

      {!enabled ? (
        <div className="empty-panel compact-empty">
          <h2>Timeline gizli.</h2>
          <p>Sade campaign gÃ¶rÃ¼nÃ¼mÃ¼ korunuyor. GerektiÄŸinde tek tuÅŸla aÃ§Ä±lÄ±r.</p>
        </div>
      ) : (
        <div className="session-timeline-layout">
          <form className="timeline-form" onSubmit={submit}>
            <AutosaveStatus
              label="Timeline taslaÄŸÄ±"
              lastSavedAt={lastSavedAt}
              restoredAt={restoredAt}
              onClear={() => {
                const confirmed = confirm("Timeline taslaÄŸÄ± temizlensin mi?");
                if (confirmed) {
                  setEditingId(null);
                  clearDraft(emptyDraft());
                }
              }}
            />
            <div className="form-grid compact-form-grid">
              <label>Oturum BaÅŸlÄ±ÄŸÄ±<input value={draft.title} onChange={(e) => setDraft({...draft, title: e.target.value})} placeholder="Session 8 - Rainbase BaskÄ±nÄ±" /></label>
              <label>Tarih<input type="date" value={draft.sessionDate} onChange={(e) => setDraft({...draft, sessionDate: e.target.value})} /></label>
            </div>
            <label>KÄ±sa Ã–zet<textarea rows={3} value={draft.summary} onChange={(e) => setDraft({...draft, summary: e.target.value})} placeholder="Oturumun ana Ã¶zeti..." /></label>
            <div className="timeline-fields-grid">
              <label>Ã–nemli Olaylar<textarea rows={4} value={listText(draft.events)} onChange={(e) => setDraft({...draft, events: lines(e.target.value)})} placeholder="Her satÄ±ra bir olay" /></label>
              <label>KarÅŸÄ±laÅŸÄ±lan NPC'ler<textarea rows={4} value={listText(draft.npcs)} onChange={(e) => setDraft({...draft, npcs: lines(e.target.value)})} placeholder="Her satÄ±ra bir NPC" /></label>
              <label>Quest GÃ¼ncellemeleri<textarea rows={4} value={listText(draft.questUpdates)} onChange={(e) => setDraft({...draft, questUpdates: lines(e.target.value)})} placeholder="Her satÄ±ra bir gÃ¼ncelleme" /></label>
              <label>KazanÄ±lan Loot<textarea rows={4} value={listText(draft.loot)} onChange={(e) => setDraft({...draft, loot: lines(e.target.value)})} placeholder="Her satÄ±ra bir Ã¶dÃ¼l" /></label>
              <label>KayÄ±plar / AyrÄ±lanlar<textarea rows={4} value={listText(draft.casualties)} onChange={(e) => setDraft({...draft, casualties: lines(e.target.value)})} placeholder="Ã–lÃ¼m, ayrÄ±lÄ±k veya Ã¶nemli kayÄ±p" /></label>
              <label>DM NotlarÄ±<textarea rows={4} value={draft.notes} onChange={(e) => setDraft({...draft, notes: e.target.value})} placeholder="Gizli veya genel notlar..." /></label>
            </div>
            <div className="timeline-form-actions">
              <button className="primary-action" type="submit">{editingId ? "KaydÄ± GÃ¼ncelle" : "Timeline'a Ekle"}</button>
              {editingId ? <button type="button" onClick={() => { setEditingId(null); clearDraft(emptyDraft()); }}>VazgeÃ§</button> : null}
            </div>
          </form>

          <div className="timeline-entry-list">
            {sortedEntries.length === 0 ? <div className="empty-panel compact-empty"><h2>HenÃ¼z kayÄ±t yok.</h2><p>Macera yaÅŸandÄ± ama tarihÃ§i iÅŸe alÄ±nmamÄ±ÅŸ.</p></div> : sortedEntries.map((entry) => (
              <article className="timeline-entry" key={entry.id}>
                <div className="timeline-entry-head">
                  <div><span>{entry.sessionDate}</span><h3>{entry.title}</h3></div>
                  <div><button type="button" onClick={() => edit(entry)}>DÃ¼zenle</button><button type="button" onClick={() => remove(entry.id)}>Sil</button></div>
                </div>
                {entry.summary ? <p className="timeline-summary">{entry.summary}</p> : null}
                <div className="timeline-entry-grid">
                  {([['Ã–nemli Olaylar', entry.events], ['NPCâ€™ler', entry.npcs], ['Quest', entry.questUpdates], ['Loot', entry.loot], ['KayÄ±plar', entry.casualties]] as const).map(([title, items]) => items.length ? <div key={title}><strong>{title}</strong><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></div> : null)}
                </div>
                {entry.notes ? <div className="timeline-notes"><strong>DM NotlarÄ±</strong><p>{entry.notes}</p></div> : null}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

