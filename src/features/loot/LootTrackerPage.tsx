import { useEffect, useMemo, useState } from "react";
import type { Character } from "../../core/character/character.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadQuestRecords } from "../quests/questJournalStorage";
import { PageShell } from "../../shared/layout/PageShell";
import { calculateLootTotal, createLootRecord, loadLootRecords, saveLootRecords, type LootKind, type LootRecord, type LootStatus } from "./lootTrackerStorage";

type LootTrackerPageProps = { campaigns: Campaign[]; characters: Character[] };
const KINDS: readonly LootKind[] = ["Para", "Eşya", "Büyülü Eşya", "Mücevher", "Belge", "Diğer"];
const STATUSES: readonly LootStatus[] = ["Bekliyor", "Paylaştırıldı", "Satıldı", "Kaybedildi"];
function sortRecords(records: LootRecord[]) { return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
export function LootTrackerPage({ campaigns, characters }: LootTrackerPageProps) {
  const [records, setRecords] = useState<LootRecord[]>(() => sortRecords(loadLootRecords()));
  const [selectedId, setSelectedId] = useState(() => records[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const quests = useMemo(() => loadQuestRecords(), []);
  useEffect(() => { saveLootRecords(records); }, [records]);
  const filtered = useMemo(() => { const needle = query.trim().toLocaleLowerCase("tr-TR"); return records.filter((record) => (campaignFilter === "all" || record.campaignId === campaignFilter) && (!needle || [record.name, record.kind, record.status, record.foundAt, record.notes, record.secretNotes].join(" ").toLocaleLowerCase("tr-TR").includes(needle))); }, [campaignFilter, query, records]);
  const pending = records.filter((record) => record.status === "Bekliyor");
  const totalValue = calculateLootTotal(records.filter((record) => record.status !== "Kaybedildi"));
  function updateSelected(updater: (record: LootRecord) => LootRecord) { setRecords((current) => sortRecords(current.map((record) => record.id === selectedId ? { ...updater(record), updatedAt: new Date().toISOString() } : record))); }
  function addRecord() { const record = createLootRecord(`Ganimet ${records.length + 1}`, campaigns[0]?.id ?? ""); setRecords((current) => sortRecords([record, ...current])); setSelectedId(record.id); }
  function deleteRecord() { if (!selected || !confirm(`“${selected.name}” silinsin mi?`)) return; const next = records.filter((record) => record.id !== selected.id); setRecords(next); setSelectedId(next[0]?.id ?? ""); }
  const campaignQuests = quests.filter((quest) => !selected?.campaignId || quest.campaignId === selected.campaignId);
  return <PageShell eyebrow="Campaign yönetimi" title="Loot + Treasure Tracker" description="Bulunan ganimetleri, görev ödüllerini, para değerlerini ve paylaştırma durumunu tek kasada takip et.">
    <section className="loot-summary"><article><strong>{records.length}</strong><span>kayıt</span></article><article><strong>{pending.length}</strong><span>paylaştırılmayı bekliyor</span></article><article><strong>{totalValue.toLocaleString("tr-TR")} gp</strong><span>toplam tahmini değer</span></article></section>
    <section className="loot-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ganimet ara..." /><select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}><option value="all">Tüm campaignler</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><button type="button" onClick={addRecord}>+ Yeni ganimet</button></section>
    {selected ? <section className="loot-layout"><aside className="loot-list">{filtered.map((record) => <button type="button" key={record.id} className={record.id === selectedId ? "active" : ""} onClick={() => setSelectedId(record.id)}><span><strong>{record.name}</strong><small>{record.kind} · {record.status}</small></span><em>{(record.quantity * record.valueGp).toLocaleString("tr-TR")} gp</em></button>)}{!filtered.length ? <p>Uyan kayıt yok.</p> : null}</aside>
      <div className="loot-editor"><header><input value={selected.name} onChange={(event) => updateSelected((record) => ({ ...record, name: event.target.value }))} aria-label="Ganimet adı" /><button className="danger" type="button" onClick={deleteRecord}>Sil</button></header>
        <div className="loot-meta-grid"><label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((record) => ({ ...record, campaignId: event.target.value, questId: "" }))}><option value="">Campaign yok</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label><label>Bağlı görev<select value={selected.questId} onChange={(event) => updateSelected((record) => ({ ...record, questId: event.target.value }))}><option value="">Görev yok</option>{campaignQuests.map((quest) => <option key={quest.id} value={quest.id}>{quest.title}</option>)}</select></label><label>Tür<select value={selected.kind} onChange={(event) => updateSelected((record) => ({ ...record, kind: event.target.value as LootKind }))}>{KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label><label>Durum<select value={selected.status} onChange={(event) => updateSelected((record) => ({ ...record, status: event.target.value as LootStatus }))}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label>Adet<input type="number" min="1" value={selected.quantity} onChange={(event) => updateSelected((record) => ({ ...record, quantity: Math.max(1, Number(event.target.value) || 1) }))} /></label><label>Birim değer (gp)<input type="number" min="0" step="0.01" value={selected.valueGp} onChange={(event) => updateSelected((record) => ({ ...record, valueGp: Math.max(0, Number(event.target.value) || 0) }))} /></label><label>Sahibi<select value={selected.ownerCharacterId} onChange={(event) => updateSelected((record) => ({ ...record, ownerCharacterId: event.target.value }))}><option value="">Parti havuzu</option>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label><label>Bulunduğu yer<input value={selected.foundAt} onChange={(event) => updateSelected((record) => ({ ...record, foundAt: event.target.value }))} placeholder="Örn. Kum Tapınağı" /></label></div>
        <label>Oyuncu notu<textarea rows={4} value={selected.notes} onChange={(event) => updateSelected((record) => ({ ...record, notes: event.target.value }))} /></label><label>DM gizli notu<textarea rows={4} value={selected.secretNotes} onChange={(event) => updateSelected((record) => ({ ...record, secretNotes: event.target.value }))} /></label><div className="loot-total">Toplam değer: <strong>{(selected.quantity * selected.valueGp).toLocaleString("tr-TR")} gp</strong></div>
      </div></section> : <div className="loot-empty"><strong>Henüz ganimet kaydı yok.</strong><button type="button" onClick={addRecord}>İlk kaydı oluştur</button></div>}
  </PageShell>;
}
