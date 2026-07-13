import { useMemo, useState } from "react";
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
  onToggleEnabled,
  onChange,
}: {
  entries: CampaignTimelineEntry[];
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onChange: (entries: CampaignTimelineEntry[]) => void;
}) {
  const [draft, setDraft] = useState<TimelineDraft>(emptyDraft);
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
    setDraft(emptyDraft());
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
    if (confirm("Bu timeline kaydı silinsin mi? Tarih yine kazananların eline kalacak.")) {
      onChange(entries.filter((entry) => entry.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft());
      }
    }
  }

  return (
    <section className="campaign-card session-timeline-card">
      <div className="campaign-section-head timeline-section-head">
        <div>
          <span className="mini-label">Optional Campaign Module</span>
          <h2>Session Timeline</h2>
          <p>Oturumların kronolojik özeti. Çünkü “geçen sefer ne olmuştu?” sorusu evrensel bir lanet.</p>
        </div>
        <button type="button" className={enabled ? "timeline-toggle active" : "timeline-toggle"} onClick={() => onToggleEnabled(!enabled)}>
          {enabled ? "Timeline Açık" : "Timeline Kapalı"}
        </button>
      </div>

      {!enabled ? (
        <div className="empty-panel compact-empty">
          <h2>Timeline gizli.</h2>
          <p>Sade campaign görünümü korunuyor. Gerektiğinde tek tuşla açılır.</p>
        </div>
      ) : (
        <div className="session-timeline-layout">
          <form className="timeline-form" onSubmit={submit}>
            <div className="form-grid compact-form-grid">
              <label>Oturum Başlığı<input value={draft.title} onChange={(e) => setDraft({...draft, title: e.target.value})} placeholder="Session 8 - Rainbase Baskını" /></label>
              <label>Tarih<input type="date" value={draft.sessionDate} onChange={(e) => setDraft({...draft, sessionDate: e.target.value})} /></label>
            </div>
            <label>Kısa Özet<textarea rows={3} value={draft.summary} onChange={(e) => setDraft({...draft, summary: e.target.value})} placeholder="Oturumun ana özeti..." /></label>
            <div className="timeline-fields-grid">
              <label>Önemli Olaylar<textarea rows={4} value={listText(draft.events)} onChange={(e) => setDraft({...draft, events: lines(e.target.value)})} placeholder="Her satıra bir olay" /></label>
              <label>Karşılaşılan NPC'ler<textarea rows={4} value={listText(draft.npcs)} onChange={(e) => setDraft({...draft, npcs: lines(e.target.value)})} placeholder="Her satıra bir NPC" /></label>
              <label>Quest Güncellemeleri<textarea rows={4} value={listText(draft.questUpdates)} onChange={(e) => setDraft({...draft, questUpdates: lines(e.target.value)})} placeholder="Her satıra bir güncelleme" /></label>
              <label>Kazanılan Loot<textarea rows={4} value={listText(draft.loot)} onChange={(e) => setDraft({...draft, loot: lines(e.target.value)})} placeholder="Her satıra bir ödül" /></label>
              <label>Kayıplar / Ayrılanlar<textarea rows={4} value={listText(draft.casualties)} onChange={(e) => setDraft({...draft, casualties: lines(e.target.value)})} placeholder="Ölüm, ayrılık veya önemli kayıp" /></label>
              <label>DM Notları<textarea rows={4} value={draft.notes} onChange={(e) => setDraft({...draft, notes: e.target.value})} placeholder="Gizli veya genel notlar..." /></label>
            </div>
            <div className="timeline-form-actions">
              <button className="primary-action" type="submit">{editingId ? "Kaydı Güncelle" : "Timeline'a Ekle"}</button>
              {editingId ? <button type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft()); }}>Vazgeç</button> : null}
            </div>
          </form>

          <div className="timeline-entry-list">
            {sortedEntries.length === 0 ? <div className="empty-panel compact-empty"><h2>Henüz kayıt yok.</h2><p>Macera yaşandı ama tarihçi işe alınmamış.</p></div> : sortedEntries.map((entry) => (
              <article className="timeline-entry" key={entry.id}>
                <div className="timeline-entry-head">
                  <div><span>{entry.sessionDate}</span><h3>{entry.title}</h3></div>
                  <div><button type="button" onClick={() => edit(entry)}>Düzenle</button><button type="button" onClick={() => remove(entry.id)}>Sil</button></div>
                </div>
                {entry.summary ? <p className="timeline-summary">{entry.summary}</p> : null}
                <div className="timeline-entry-grid">
                  {([['Önemli Olaylar', entry.events], ['NPC’ler', entry.npcs], ['Quest', entry.questUpdates], ['Loot', entry.loot], ['Kayıplar', entry.casualties]] as const).map(([title, items]) => items.length ? <div key={title}><strong>{title}</strong><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></div> : null)}
                </div>
                {entry.notes ? <div className="timeline-notes"><strong>DM Notları</strong><p>{entry.notes}</p></div> : null}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
