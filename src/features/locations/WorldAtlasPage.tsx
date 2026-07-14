import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "../campaigns/campaignTypes";
import { loadNpcRecords } from "../npc-manager/npcManagerStorage";
import { PageShell } from "../../shared/layout/PageShell";
import { createWorldLocation, getLocationDepth, loadWorldLocations, removeLocationAndDetach, saveWorldLocations, type LocationKind, type WorldLocation } from "./locationAtlasStorage";

type WorldAtlasPageProps = { campaigns: Campaign[] };
const KINDS: readonly LocationKind[] = ["Bölge", "Şehir", "Kasaba", "Bina", "Zindan", "Doğa", "Diğer"];

function sortLocations(locations: WorldLocation[]) {
  return [...locations].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function WorldAtlasPage({ campaigns }: WorldAtlasPageProps) {
  const [locations, setLocations] = useState<WorldLocation[]>(() => sortLocations(loadWorldLocations()));
  const [selectedId, setSelectedId] = useState(() => locations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const selected = locations.find((location) => location.id === selectedId) ?? null;
  const npcs = useMemo(() => loadNpcRecords(), []);

  useEffect(() => { saveWorldLocations(locations); }, [locations]);

  const campaignMap = useMemo(() => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])), [campaigns]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return locations.filter((location) => {
      if (campaignFilter !== "all" && location.campaignId !== campaignFilter) return false;
      if (!normalized) return true;
      return [location.name, location.kind, location.status, location.description, location.secretNotes, ...location.tags]
        .join(" ").toLocaleLowerCase("tr-TR").includes(normalized);
    });
  }, [campaignFilter, locations, query]);

  function updateSelected(updater: (location: WorldLocation) => WorldLocation) {
    setLocations((current) => sortLocations(current.map((location) => location.id === selectedId ? { ...updater(location), updatedAt: new Date().toISOString() } : location)));
  }

  function addLocation() {
    const location = createWorldLocation(`Mekân ${locations.length + 1}`, campaigns[0]?.id ?? "");
    setLocations((current) => sortLocations([location, ...current]));
    setSelectedId(location.id);
  }

  function deleteLocation() {
    if (!selected || !confirm(`“${selected.name}” silinsin mi? Alt mekânlar ana seviyeye taşınacak.`)) return;
    const next = removeLocationAndDetach(locations, selected.id);
    setLocations(next);
    setSelectedId(next[0]?.id ?? "");
  }

  const parentOptions = locations.filter((location) => location.id !== selectedId && location.campaignId === selected?.campaignId);
  const campaignNpcs = npcs.filter((npc) => !selected?.campaignId || npc.campaignId === selected.campaignId);

  return <PageShell eyebrow="Dünya inşası" title="Locations + World Atlas" description="Campaign bölgelerini, şehirleri, binaları, zindanları ve önemli mekânları hiyerarşik biçimde düzenle. Harita çizmeden de dünya kurulur; yalnızca notları kaybetmemek gerekir.">
    <section className="atlas-toolbar">
      <div><strong>{locations.length}</strong><span>mekân kaydı</span></div>
      <div className="atlas-toolbar-actions">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mekân ara..." aria-label="Mekân ara" />
        <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}><option value="all">Tüm campaignler</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
        <button type="button" onClick={addLocation}>+ Yeni mekân</button>
      </div>
    </section>

    {locations.length && selected ? <section className="atlas-layout">
      <aside className="atlas-list" aria-label="Mekân listesi">
        {filtered.map((location) => <button key={location.id} type="button" className={location.id === selectedId ? "active" : ""} onClick={() => setSelectedId(location.id)} style={{ paddingLeft: `${14 + getLocationDepth(locations, location.id) * 14}px` }}>
          <span><strong>{location.name}</strong><small>{location.kind} · {campaignMap.get(location.campaignId) || "Campaign yok"}</small></span><em>{location.linkedNpcIds.length}</em>
        </button>)}
        {!filtered.length ? <p>Aramaya uyan mekân yok.</p> : null}
      </aside>

      <div className="atlas-editor">
        <header className="atlas-editor-header"><div><span>Aktif mekân</span><input value={selected.name} onChange={(event) => updateSelected((location) => ({ ...location, name: event.target.value }))} aria-label="Mekân adı" /></div><button type="button" className="danger" onClick={deleteLocation}>Mekânı sil</button></header>
        <div className="atlas-meta-grid">
          <label>Campaign<select value={selected.campaignId} onChange={(event) => updateSelected((location) => ({ ...location, campaignId: event.target.value, parentId: "", linkedNpcIds: [] }))}><option value="">Campaign seçilmedi</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label>Tür<select value={selected.kind} onChange={(event) => updateSelected((location) => ({ ...location, kind: event.target.value as LocationKind }))}>{KINDS.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
          <label>Üst mekân<select value={selected.parentId} onChange={(event) => updateSelected((location) => ({ ...location, parentId: event.target.value }))}><option value="">Ana seviye</option>{parentOptions.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          <label>Durum<input value={selected.status} onChange={(event) => updateSelected((location) => ({ ...location, status: event.target.value }))} placeholder="Aktif, yıkılmış, gizli..." /></label>
          <label className="atlas-span-two">Etiketler<input value={selected.tags.join(", ")} onChange={(event) => updateSelected((location) => ({ ...location, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="liman, çöl, tehlikeli" /></label>
        </div>
        <section className="atlas-notes-grid"><label>Oyuncuların bildiği açıklama<textarea value={selected.description} onChange={(event) => updateSelected((location) => ({ ...location, description: event.target.value }))} /></label><label>DM gizli notları<textarea value={selected.secretNotes} onChange={(event) => updateSelected((location) => ({ ...location, secretNotes: event.target.value }))} /></label></section>
        <section className="atlas-npcs-card"><header><div><span>Yerleşik karakterler</span><h2>Bağlı NPC'ler</h2></div><strong>{selected.linkedNpcIds.length}</strong></header><div className="atlas-npc-grid">{campaignNpcs.map((npc) => { const checked = selected.linkedNpcIds.includes(npc.id); return <label key={npc.id}><input type="checkbox" checked={checked} onChange={() => updateSelected((location) => ({ ...location, linkedNpcIds: checked ? location.linkedNpcIds.filter((id) => id !== npc.id) : [...location.linkedNpcIds, npc.id] }))} /><span><strong>{npc.name}</strong><small>{npc.role || npc.disposition}</small></span></label>; })}{!campaignNpcs.length ? <p>Bu campaign için kayıtlı NPC bulunmuyor.</p> : null}</div></section>
      </div>
    </section> : <section className="atlas-empty"><h2>Henüz mekân yok</h2><p>İlk şehri, zindanı veya fazlasıyla şüpheli hanı oluştur.</p><button type="button" onClick={addLocation}>İlk mekânı oluştur</button></section>}
  </PageShell>;
}
