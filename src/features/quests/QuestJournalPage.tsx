import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadFactionRecords } from "../factions/factionStorage";
import { loadWorldLocations } from "../locations/locationAtlasStorage";
import { loadNpcRecords } from "../npc-manager/npcManagerStorage";
import { PageShell } from "../../shared/layout/PageShell";
import { calculateQuestProgress, createQuestRecord, loadQuestRecords, saveQuestRecords, type QuestPriority, type QuestRecord, type QuestStatus } from "./questJournalStorage";

type QuestJournalPageProps = { campaigns: Campaign[] };
const STATUSES: readonly QuestStatus[] = ["Taslak", "Aktif", "Beklemede", "Tamamlandı", "Başarısız"];
const PRIORITIES: readonly QuestPriority[] = ["Düşük", "Normal", "Yüksek", "Kritik"];
function sortQuests(records: QuestRecord[]) { const order: Record<QuestStatus, number> = { Aktif: 0, Beklemede: 1, Taslak: 2, Tamamlandı: 3, Başarısız: 4 }; return [...records].sort((a, b) => order[a.status] - order[b.status] || b.updatedAt.localeCompare(a.updatedAt)); }

export function QuestJournalPage({ campaigns }: QuestJournalPageProps) {
  const [records, setRecords] = useState<QuestRecord[]>(() => sortQuests(loadQuestRecords()));
  const [selectedId, setSelectedId] = useState(() => records[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const npcs = useMemo(() => loadNpcRecords(), []);
  const locations = useMemo(() => loadWorldLocations(), []);
  const factions = useMemo(() => loadFactionRecords(), []);
  useEffect(() => { saveQuestRecords(records); }, [records]);
  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return records.filter((record) => {
      if (campaignFilter !== "all" && record.campaignId !== campaignFilter) return false;
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (!normalized) return true;
      return [record.title, record.status, record.priority, record.summary, record.secretNotes, record.reward, ...record.tags, ...record.objectives.map((objective) => objective.text)].join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
    });
  }, [campaignFilter, query, records, statusFilter]);
  function updateSelected(updater: (record: QuestRecord) => QuestRecord) { setRecords((current) => sortQuests(current.map((record) => record.id === selectedId ? { ...updater(record), updatedAt: new Date().toISOString() } : record))); }
  function addQuest() { const record = createQuestRecord(`Görev ${records.length + 1}`, campaigns[0]?.id ?? ""); setRecords((current) => sortQuests([record, ...current])); setSelectedId(record.id); }
  function deleteQuest() { if (!selected || !confirm(`“${selected.title}” silinsin mi?`)) return; const next = records.filter((record) => record.id !== selected.id); setRecords(next); setSelectedId(next[0]?.id ?? ""); }
  const campaignNpcs = npcs.filter((npc) => !selected?.campaignId || npc.campaignId === selected.campaignId);
  const campaignLocations = locations.filter((location) => !selected?.campaignId || location.campaignId === selected.campaignId);
  const campaignFactions = factions.filter((faction) => !selected?.campaignId || faction.campaignId === selected.campaignId);
  const progress = selected ? calculateQuestProgress(selected) : 0;

  return <PageShell eyebrow="Campaign yönetimi" title="Quest Journal + Plot Threads" description="Ana görevleri, yan görevleri ve açık kalan hikâye ipliklerini; hedefleri, bağlantıları, ödülleri ve DM sırlarıyla tek yerde takip et.">
    <section className="quest-toolbar"><div><strong>{records.length}</strong><span>görev kaydı</span></div><div className="quest-toolbar-actions">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Görev ara..." aria-label="Görev ara" />
      <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}><option value="all">Tüm campaignler</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tüm durumlar</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
      <button type="button" onClick={addQuest}>+ Yeni görev</button>
    </div></section>
    {records.length && selected ? <section className="quest-layout">
      <aside className="quest-list" aria-label="Görev listesi">{filtered.map((record) => <button key={record.id} type="button" className={record.id === selectedId ? "active" : ""} onClick={() => setSelectedId(record.id)}><span><strong>{record.title}</strong><small>{record.status} · {campaignMap.get(record.campaignId) || "Campaign yok"}</small></span><em>{calculateQuestProgress(record)}%</em></button>)}{!filtered.length ? <p>Aramaya uyan görev yok.</p> : null}</aside>
      <div className="quest-editor">
        <header className="quest-editor-header"><div><span>Aktif görev</span><input value={selected.title} onChange={(event) => updateSelected((record) => ({ ...record, title: event.target.value }))} aria-label="Görev adı" /></div><button type="button" className="danger" onClick={deleteQuest}>Görevi sil</button></header>
        <div className="quest-progress"><span style={{ width: `${progress}%` }} /><strong>{progress}% tamamlandı</strong></div>
        <div className="quest-meta-grid">
          <label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((record) => ({ ...record, campaignId: event.target.value, giverNpcId: "", locationId: "", factionId: "" }))}><option value="">Campaign seçilmedi</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label>Durum<select value={selected.status} onChange={(event) => updateSelected((record) => ({ ...record, status: event.target.value as QuestStatus }))}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Öncelik<select value={selected.priority} onChange={(event) => updateSelected((record) => ({ ...record, priority: event.target.value as QuestPriority }))}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label>Görevi veren NPC<select value={selected.giverNpcId} onChange={(event) => updateSelected((record) => ({ ...record, giverNpcId: event.target.value }))}><option value="">Bağlantı yok</option>{campaignNpcs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}</select></label>
          <label>Mekân<select value={selected.locationId} onChange={(event) => updateSelected((record) => ({ ...record, locationId: event.target.value }))}><option value="">Bağlantı yok</option>{campaignLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          <label>Oluşum<select value={selected.factionId} onChange={(event) => updateSelected((record) => ({ ...record, factionId: event.target.value }))}><option value="">Bağlantı yok</option>{campaignFactions.map((faction) => <option key={faction.id} value={faction.id}>{faction.name}</option>)}</select></label>
          <label className="quest-span-two">Etiketler<input value={selected.tags.join(", ")} onChange={(event) => updateSelected((record) => ({ ...record, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="ana görev, siyasi, gizem" /></label>
        </div>
        <section className="quest-notes-grid"><label>Oyuncu özeti<textarea value={selected.summary} onChange={(event) => updateSelected((record) => ({ ...record, summary: event.target.value }))} /></label><label>DM gizli notları<textarea value={selected.secretNotes} onChange={(event) => updateSelected((record) => ({ ...record, secretNotes: event.target.value }))} /></label></section>
        <label className="quest-reward">Ödül veya sonuç<input value={selected.reward} onChange={(event) => updateSelected((record) => ({ ...record, reward: event.target.value }))} placeholder="Altın, eşya, itibar veya hikâye sonucu" /></label>
        <section className="quest-card"><header><div><span>İlerleme</span><h2>Görev hedefleri</h2></div><button type="button" onClick={() => updateSelected((record) => ({ ...record, objectives: [...record.objectives, { id: crypto.randomUUID(), text: "Yeni hedef", completed: false }] }))}>+ Hedef ekle</button></header><div className="quest-objective-list">{selected.objectives.map((objective) => <div key={objective.id}><input type="checkbox" checked={objective.completed} onChange={() => updateSelected((record) => ({ ...record, objectives: record.objectives.map((item) => item.id === objective.id ? { ...item, completed: !item.completed } : item) }))} /><input value={objective.text} onChange={(event) => updateSelected((record) => ({ ...record, objectives: record.objectives.map((item) => item.id === objective.id ? { ...item, text: event.target.value } : item) }))} /><button type="button" className="danger" onClick={() => updateSelected((record) => ({ ...record, objectives: record.objectives.filter((item) => item.id !== objective.id) }))}>Sil</button></div>)}{!selected.objectives.length ? <p>Henüz hedef eklenmedi.</p> : null}</div></section>
      </div>
    </section> : <section className="quest-empty"><h2>Henüz görev yok</h2><p>İlk ana görevi veya oyuncuların üç oturum boyunca görmezden geleceği yan görevi oluştur.</p><button type="button" onClick={addQuest}>İlk görevi oluştur</button></section>}
  </PageShell>;
}
