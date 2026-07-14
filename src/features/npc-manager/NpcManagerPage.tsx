import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "../campaigns/campaignTypes";
import { PageShell } from "../../shared/layout/PageShell";
import { createNpcRecord, getNpcRelationshipCount, loadNpcRecords, saveNpcRecords, type NpcDisposition, type NpcRecord } from "./npcManagerStorage";

type NpcManagerPageProps = { campaigns: Campaign[] };
const DISPOSITIONS: readonly NpcDisposition[] = ["Dost", "Tarafsız", "Şüpheli", "Düşman"];

function sortRecords(records: NpcRecord[]) { return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }

export function NpcManagerPage({ campaigns }: NpcManagerPageProps) {
  const [records, setRecords] = useState<NpcRecord[]>(() => sortRecords(loadNpcRecords()));
  const [selectedId, setSelectedId] = useState(() => records[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const selected = records.find((npc) => npc.id === selectedId) ?? null;

  useEffect(() => { saveNpcRecords(records); }, [records]);

  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return records.filter((npc) => {
      if (campaignFilter !== "all" && npc.campaignId !== campaignFilter) return false;
      if (!normalized) return true;
      return [npc.name, npc.role, npc.location, npc.status, npc.publicNotes, npc.secretNotes, ...npc.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
    });
  }, [campaignFilter, query, records]);

  function updateSelected(updater: (npc: NpcRecord) => NpcRecord) {
    setRecords((current) => sortRecords(current.map((npc) => npc.id === selectedId ? { ...updater(npc), updatedAt: new Date().toISOString() } : npc)));
  }

  function addNpc() {
    const npc = createNpcRecord(`NPC ${records.length + 1}`, campaigns[0]?.id ?? "");
    setRecords((current) => [npc, ...current]); setSelectedId(npc.id);
  }

  function deleteNpc() {
    if (!selected || !confirm(`“${selected.name}” silinsin mi?`)) return;
    const remaining = records.filter((npc) => npc.id !== selected.id).map((npc) => ({ ...npc, relationships: npc.relationships.filter((relationship) => relationship.targetNpcId !== selected.id) }));
    setRecords(remaining); setSelectedId(remaining[0]?.id ?? "");
  }

  return <PageShell eyebrow="Dünya yönetimi" title="NPC Manager" description="NPC kimliğini, rolünü, konumunu, gizli notlarını ve diğer karakterlerle ilişkilerini tek merkezde tut. 'Bu adam kimdi?' sorusunu hafızaya bırakmak artık kabul edilebilir bir DM tekniği değil.">
    <section className="npc-toolbar">
      <div><strong>{records.length}</strong><span>NPC kaydı</span></div>
      <div className="npc-toolbar-actions"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="NPC ara..." aria-label="NPC ara" /><select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}><option value="all">Tüm campaignler</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><button type="button" onClick={addNpc}>+ Yeni NPC</button></div>
    </section>

    {records.length && selected ? <section className="npc-layout">
      <aside className="npc-list" aria-label="NPC listesi">
        {filtered.map((npc) => <button key={npc.id} type="button" className={npc.id === selectedId ? "active" : ""} onClick={() => setSelectedId(npc.id)}><span><strong>{npc.name}</strong><small>{npc.role || campaignMap.get(npc.campaignId) || "Rol belirtilmedi"}</small></span><em>{getNpcRelationshipCount(records, npc.id)}</em></button>)}
        {!filtered.length ? <p>Aramaya uyan NPC yok.</p> : null}
      </aside>

      <div className="npc-editor">
        <header className="npc-editor-header"><div><span>Aktif kayıt</span><input value={selected.name} onChange={(event) => updateSelected((npc) => ({ ...npc, name: event.target.value }))} aria-label="NPC adı" /></div><button type="button" className="danger" onClick={deleteNpc}>NPC'yi sil</button></header>
        <div className="npc-meta-grid">
          <label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((npc) => ({ ...npc, campaignId: event.target.value }))}><option value="">Campaign seçilmedi</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label>Rol<input value={selected.role} onChange={(event) => updateSelected((npc) => ({ ...npc, role: event.target.value }))} placeholder="Hükümdar, muhbir, tüccar..." /></label>
          <label>Konum<input value={selected.location} onChange={(event) => updateSelected((npc) => ({ ...npc, location: event.target.value }))} placeholder="Şehir, bölge veya üs" /></label>
          <label>Tutum<select value={selected.disposition} onChange={(event) => updateSelected((npc) => ({ ...npc, disposition: event.target.value as NpcDisposition }))}>{DISPOSITIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Durum<input value={selected.status} onChange={(event) => updateSelected((npc) => ({ ...npc, status: event.target.value }))} placeholder="Aktif, kayıp, ölü..." /></label>
          <label>Etiketler<input value={selected.tags.join(", ")} onChange={(event) => updateSelected((npc) => ({ ...npc, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="saray, devrimci, gizemli" /></label>
        </div>
        <section className="npc-notes-grid"><label>Oyuncuların bildiği notlar<textarea value={selected.publicNotes} onChange={(event) => updateSelected((npc) => ({ ...npc, publicNotes: event.target.value }))} /></label><label>DM gizli notları<textarea value={selected.secretNotes} onChange={(event) => updateSelected((npc) => ({ ...npc, secretNotes: event.target.value }))} /></label></section>
        <section className="npc-relations-card"><header><div><span>Bağlantılar</span><h2>İlişkiler</h2></div><button type="button" disabled={records.length < 2} onClick={() => { const target = records.find((npc) => npc.id !== selected.id); if (!target) return; updateSelected((npc) => ({ ...npc, relationships: [...npc.relationships, { id: crypto.randomUUID(), targetNpcId: target.id, label: "Bağlantı" }] })); }}>+ İlişki</button></header>
          <div className="npc-relations-list">{selected.relationships.map((relationship) => <div key={relationship.id}><select value={relationship.targetNpcId} onChange={(event) => updateSelected((npc) => ({ ...npc, relationships: npc.relationships.map((item) => item.id === relationship.id ? { ...item, targetNpcId: event.target.value } : item) }))}>{records.filter((npc) => npc.id !== selected.id).map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}</select><input value={relationship.label} onChange={(event) => updateSelected((npc) => ({ ...npc, relationships: npc.relationships.map((item) => item.id === relationship.id ? { ...item, label: event.target.value } : item) }))} placeholder="Müttefik, rakip, ailesi..." /><button type="button" aria-label="İlişkiyi sil" onClick={() => updateSelected((npc) => ({ ...npc, relationships: npc.relationships.filter((item) => item.id !== relationship.id) }))}>×</button></div>)}{!selected.relationships.length ? <p>Henüz ilişki eklenmedi.</p> : null}</div>
        </section>
      </div>
    </section> : <section className="npc-empty"><strong>Henüz NPC kaydı yok.</strong><p>İlk NPC'yi oluşturarak dünya notlarını hafızanın merhametinden kurtar.</p><button type="button" onClick={addNpc}>İlk NPC'yi oluştur</button></section>}
  </PageShell>;
}
