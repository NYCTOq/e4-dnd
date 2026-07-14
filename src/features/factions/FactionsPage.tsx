import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadWorldLocations } from "../locations/locationAtlasStorage";
import { loadNpcRecords } from "../npc-manager/npcManagerStorage";
import { PageShell } from "../../shared/layout/PageShell";
import { createFactionRecord, loadFactionRecords, removeFactionAndRelations, saveFactionRecords, type FactionKind, type FactionRecord, type FactionStanding } from "./factionStorage";

type FactionsPageProps = { campaigns: Campaign[] };
const KINDS: readonly FactionKind[] = ["Krallık", "Lonca", "Tarikat", "Korsan Tayfası", "Şirket", "Gizli Örgüt", "Diğer"];
const STANDINGS: readonly FactionStanding[] = ["Müttefik", "Tarafsız", "Gergin", "Düşman"];

function sortFactions(records: FactionRecord[]) {
  return [...records].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function FactionsPage({ campaigns }: FactionsPageProps) {
  const [records, setRecords] = useState<FactionRecord[]>(() => sortFactions(loadFactionRecords()));
  const [selectedId, setSelectedId] = useState(() => records[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const npcs = useMemo(() => loadNpcRecords(), []);
  const locations = useMemo(() => loadWorldLocations(), []);

  useEffect(() => { saveFactionRecords(records); }, [records]);

  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return records.filter((record) => {
      if (campaignFilter !== "all" && record.campaignId !== campaignFilter) return false;
      if (!normalized) return true;
      return [record.name, record.kind, record.status, record.motto, record.publicGoal, record.secretGoal, ...record.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
    });
  }, [campaignFilter, query, records]);

  function updateSelected(updater: (record: FactionRecord) => FactionRecord) {
    setRecords((current) => sortFactions(current.map((record) => record.id === selectedId
      ? { ...updater(record), updatedAt: new Date().toISOString() }
      : record)));
  }

  function addFaction() {
    const record = createFactionRecord(`Oluşum ${records.length + 1}`, campaigns[0]?.id ?? "");
    setRecords((current) => sortFactions([record, ...current]));
    setSelectedId(record.id);
  }

  function deleteFaction() {
    if (!selected || !confirm(`“${selected.name}” silinsin mi? Bağlı ilişkiler de temizlenecek.`)) return;
    const next = removeFactionAndRelations(records, selected.id);
    setRecords(next);
    setSelectedId(next[0]?.id ?? "");
  }

  function addRelation() {
    if (!selected) return;
    const target = records.find((record) => record.id !== selected.id && record.campaignId === selected.campaignId);
    if (!target) return;
    updateSelected((record) => ({ ...record, relations: [...record.relations, { id: crypto.randomUUID(), targetFactionId: target.id, standing: "Tarafsız", notes: "" }] }));
  }

  const campaignNpcs = npcs.filter((npc) => !selected?.campaignId || npc.campaignId === selected.campaignId);
  const campaignLocations = locations.filter((location) => !selected?.campaignId || location.campaignId === selected.campaignId);
  const relationTargets = records.filter((record) => record.id !== selectedId && record.campaignId === selected?.campaignId);

  return <PageShell eyebrow="Dünya inşası" title="Factions + Organizations" description="Krallıkları, loncaları, tarikatları, korsan tayfalarını ve gizli örgütleri; üyeleri, merkezleri, hedefleri ve birbirleriyle ilişkileriyle tek yerde yönet.">
    <section className="faction-toolbar">
      <div><strong>{records.length}</strong><span>oluşum kaydı</span></div>
      <div className="faction-toolbar-actions">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Oluşum ara..." aria-label="Oluşum ara" />
        <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}><option value="all">Tüm campaignler</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
        <button type="button" onClick={addFaction}>+ Yeni oluşum</button>
      </div>
    </section>

    {records.length && selected ? <section className="faction-layout">
      <aside className="faction-list" aria-label="Oluşum listesi">
        {filtered.map((record) => <button key={record.id} type="button" className={record.id === selectedId ? "active" : ""} onClick={() => setSelectedId(record.id)}>
          <span><strong>{record.name}</strong><small>{record.kind} · {campaignMap.get(record.campaignId) || "Campaign yok"}</small></span><em>{record.memberNpcIds.length}</em>
        </button>)}
        {!filtered.length ? <p>Aramaya uyan oluşum yok.</p> : null}
      </aside>

      <div className="faction-editor">
        <header className="faction-editor-header"><div><span>Aktif oluşum</span><input value={selected.name} onChange={(event) => updateSelected((record) => ({ ...record, name: event.target.value }))} aria-label="Oluşum adı" /></div><button type="button" className="danger" onClick={deleteFaction}>Oluşumu sil</button></header>
        <div className="faction-meta-grid">
          <label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((record) => ({ ...record, campaignId: event.target.value, headquartersLocationId: "", memberNpcIds: [], relations: [] }))}><option value="">Campaign seçilmedi</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label>Tür<select value={selected.kind} onChange={(event) => updateSelected((record) => ({ ...record, kind: event.target.value as FactionKind }))}>{KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
          <label>Durum<input value={selected.status} onChange={(event) => updateSelected((record) => ({ ...record, status: event.target.value }))} placeholder="Aktif, dağılmış, gizli..." /></label>
          <label>Merkez<select value={selected.headquartersLocationId} onChange={(event) => updateSelected((record) => ({ ...record, headquartersLocationId: event.target.value }))}><option value="">Merkez seçilmedi</option>{campaignLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          <label className="faction-span-two">Slogan<input value={selected.motto} onChange={(event) => updateSelected((record) => ({ ...record, motto: event.target.value }))} placeholder="Oluşumun sözü veya mottosu" /></label>
          <label className="faction-span-two">Etiketler<input value={selected.tags.join(", ")} onChange={(event) => updateSelected((record) => ({ ...record, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="askeri, gizli, dini" /></label>
        </div>
        <section className="faction-notes-grid"><label>Bilinen amaç<textarea value={selected.publicGoal} onChange={(event) => updateSelected((record) => ({ ...record, publicGoal: event.target.value }))} /></label><label>DM gizli amacı<textarea value={selected.secretGoal} onChange={(event) => updateSelected((record) => ({ ...record, secretGoal: event.target.value }))} /></label></section>

        <section className="faction-card"><header><div><span>Üyelik</span><h2>Bağlı NPC'ler</h2></div><strong>{selected.memberNpcIds.length}</strong></header><div className="faction-member-grid">{campaignNpcs.map((npc) => { const checked = selected.memberNpcIds.includes(npc.id); return <label key={npc.id}><input type="checkbox" checked={checked} onChange={() => updateSelected((record) => ({ ...record, memberNpcIds: checked ? record.memberNpcIds.filter((id) => id !== npc.id) : [...record.memberNpcIds, npc.id] }))} /><span><strong>{npc.name}</strong><small>{npc.role || npc.disposition}</small></span></label>; })}{!campaignNpcs.length ? <p>Bu campaign için kayıtlı NPC bulunmuyor.</p> : null}</div></section>

        <section className="faction-card faction-relations"><header><div><span>Diplomasi</span><h2>Oluşum ilişkileri</h2></div><button type="button" onClick={addRelation} disabled={!relationTargets.length}>+ İlişki ekle</button></header>
          <div className="faction-relation-list">{selected.relations.map((relation) => <div key={relation.id}>
            <select value={relation.targetFactionId} onChange={(event) => updateSelected((record) => ({ ...record, relations: record.relations.map((item) => item.id === relation.id ? { ...item, targetFactionId: event.target.value } : item) }))}>{relationTargets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select>
            <select value={relation.standing} onChange={(event) => updateSelected((record) => ({ ...record, relations: record.relations.map((item) => item.id === relation.id ? { ...item, standing: event.target.value as FactionStanding } : item) }))}>{STANDINGS.map((standing) => <option key={standing}>{standing}</option>)}</select>
            <input value={relation.notes} onChange={(event) => updateSelected((record) => ({ ...record, relations: record.relations.map((item) => item.id === relation.id ? { ...item, notes: event.target.value } : item) }))} placeholder="İlişki notu" />
            <button type="button" className="danger" onClick={() => updateSelected((record) => ({ ...record, relations: record.relations.filter((item) => item.id !== relation.id) }))}>Sil</button>
          </div>)}{!selected.relations.length ? <p>Henüz ilişki kaydı yok.</p> : null}</div>
        </section>
      </div>
    </section> : <section className="faction-empty"><h2>Henüz oluşum yok</h2><p>İlk loncayı, krallığı veya fazlasıyla masum görünen gizli örgütü oluştur.</p><button type="button" onClick={addFaction}>İlk oluşumu oluştur</button></section>}
  </PageShell>;
}
