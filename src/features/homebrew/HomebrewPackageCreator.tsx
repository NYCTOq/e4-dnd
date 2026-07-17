import { useMemo, useState } from "react";
import { createEntityFromDraft, createPackageFromDraft, DEFAULT_HOMEBREW_CREATOR_DRAFT, type HomebrewCreatorDraft } from "../../core/homebrew/homebrewCreator";
import { exportHomebrewPackage, importHomebrewPackage, validateHomebrewPackage, type HomebrewEntity, type HomebrewEntityType, type HomebrewPackage } from "../../core/homebrew/homebrewFoundation";
import { loadHomebrewLibraryPreferences, loadHomebrewPackages, loadHomebrewPackageSnapshots, saveHomebrewLibraryPreferences, saveHomebrewPackages, saveHomebrewPackageSnapshots } from "./homebrewStorage";
import { moveHomebrewPackagePriority, normalizeHomebrewLibraryPreferences, resolveHomebrewMarketplaceLibrary, toggleHomebrewPackage, type HomebrewLibraryPreference } from "../../core/homebrew/homebrewMarketplaceLibrary";
import { applyHomebrewMarketplaceManifest, pruneHomebrewSnapshots, rollbackHomebrewPackage, type HomebrewPackageSnapshot } from "../../core/homebrew/homebrewMarketplaceUpdate";
import { importHomebrewShareManifest } from "../../core/homebrew/homebrewPackageSharing";

const ENTITY_LABELS: Record<HomebrewEntityType, string> = {
  class: "Class",
  subclass: "Subclass",
  species: "Species",
  background: "Background",
  feat: "Feat",
  spell: "Spell",
  item: "Item",
};

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function HomebrewPackageCreator() {
  const [draft, setDraft] = useState<HomebrewCreatorDraft>(DEFAULT_HOMEBREW_CREATOR_DRAFT);
  const [stagedEntities, setStagedEntities] = useState<HomebrewEntity[]>([]);
  const [packages, setPackages] = useState<HomebrewPackage[]>(() => loadHomebrewPackages());
  const [importText, setImportText] = useState("");
  const [libraryPreferences, setLibraryPreferences] = useState<HomebrewLibraryPreference[]>(() => normalizeHomebrewLibraryPreferences(loadHomebrewPackages(), loadHomebrewLibraryPreferences()));
  const [message, setMessage] = useState("");
  const [marketplaceText, setMarketplaceText] = useState("");
  const [snapshots, setSnapshots] = useState<HomebrewPackageSnapshot[]>(() => loadHomebrewPackageSnapshots());

  const marketplace = useMemo(() => resolveHomebrewMarketplaceLibrary(packages, libraryPreferences), [packages, libraryPreferences]);

  const preview = useMemo(() => {
    if (!draft.name.trim()) return null;
    try { return createEntityFromDraft(draft); } catch { return null; }
  }, [draft]);

  function update<K extends keyof HomebrewCreatorDraft>(key: K, value: HomebrewCreatorDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function stageEntity() {
    try {
      const entity = createEntityFromDraft(draft);
      setStagedEntities((current) => [...current.filter((item) => item.id !== entity.id), entity]);
      setDraft((current) => ({ ...current, name: "", description: "", resourceName: "", actionName: "", actionSummary: "" }));
      setMessage(`${entity.name} pakete eklendi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Entity oluşturulamadı.");
    }
  }

  function savePackage() {
    try {
      const pkg = createPackageFromDraft(draft, stagedEntities);
      const report = validateHomebrewPackage(pkg);
      if (!report.valid) throw new Error(report.blockers.join(" "));
      const next = [...packages.filter((item) => item.id !== pkg.id), pkg];
      saveHomebrewPackages(next);
      setPackages(next);
      const preferences = normalizeHomebrewLibraryPreferences(next, libraryPreferences);
      setLibraryPreferences(preferences);
      saveHomebrewLibraryPreferences(preferences);
      setStagedEntities([]);
      setMessage(`${pkg.name} kaydedildi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Paket kaydedilemedi.");
    }
  }

  function applyMarketplaceUpdate() {
    try {
      const manifest = importHomebrewShareManifest(marketplaceText, "5.16.0");
      const result = applyHomebrewMarketplaceManifest(packages, manifest, snapshots, "5.16.0");
      if (result.blockers.length) throw new Error(result.blockers.join(" "));
      const nextSnapshots = pruneHomebrewSnapshots(result.snapshots, 5);
      saveHomebrewPackages(result.packages);
      saveHomebrewPackageSnapshots(nextSnapshots);
      setPackages(result.packages);
      setSnapshots(nextSnapshots);
      const preferences = normalizeHomebrewLibraryPreferences(result.packages, libraryPreferences);
      setLibraryPreferences(preferences);
      saveHomebrewLibraryPreferences(preferences);
      setMarketplaceText("");
      setMessage(result.updatedPackageIds.length ? `${result.updatedPackageIds.length} paket güncellendi ve önceki sürümler yedeklendi.` : "Uygulanacak daha yeni paket bulunamadı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Marketplace güncellemesi uygulanamadı.");
    }
  }

  function rollbackSnapshot(snapshotId: string) {
    const result = rollbackHomebrewPackage(packages, snapshots, snapshotId);
    if (result.blockers.length) { setMessage(result.blockers.join(" ")); return; }
    const nextSnapshots = pruneHomebrewSnapshots(result.snapshots, 5);
    saveHomebrewPackages(result.packages);
    saveHomebrewPackageSnapshots(nextSnapshots);
    setPackages(result.packages);
    setSnapshots(nextSnapshots);
    setMessage(result.warnings[0] ?? "Paket geri alındı.");
  }

  function importPackage() {
    try {
      const pkg = importHomebrewPackage(importText);
      const next = [...packages.filter((item) => item.id !== pkg.id), pkg];
      saveHomebrewPackages(next);
      setPackages(next);
      const preferences = normalizeHomebrewLibraryPreferences(next, libraryPreferences);
      setLibraryPreferences(preferences);
      saveHomebrewLibraryPreferences(preferences);
      setImportText("");
      setMessage(`${pkg.name} içe aktarıldı.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Paket içe aktarılamadı.");
    }
  }

  return (
    <section className="homebrew-package-builder" aria-labelledby="homebrew-package-builder-title">
      <div className="homebrew-card-head">
        <div>
          <span className="mini-label">Creator V3</span>
          <h2 id="homebrew-package-builder-title">Homebrew Package & Runtime Builder</h2>
          <p>Class’tan item’a kadar ortak şema, resource ve action tanımları.</p>
        </div>
        <button className="primary-action" type="button" onClick={savePackage} disabled={!stagedEntities.length}>Paketi Kaydet</button>
      </div>

      {message ? <p className="homebrew-builder-message" role="status">{message}</p> : null}

      <div className="homebrew-builder-grid">
        <div className="homebrew-form-card">
          <h3>Paket bilgileri</h3>
          <div className="form-grid">
            <label>Paket adı<input value={draft.packageName} onChange={(event) => update("packageName", event.target.value)} /></label>
            <label>Sürüm<input value={draft.packageVersion} onChange={(event) => update("packageVersion", event.target.value)} /></label>
            <label>Yazar<input value={draft.packageAuthor} onChange={(event) => update("packageAuthor", event.target.value)} /></label>
            <label>İçerik türü<select value={draft.type} onChange={(event) => update("type", event.target.value as HomebrewEntityType)}>{Object.entries(ENTITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Ad<input value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Kum Muhafızı" /></label>
            <label>Etiketler<input value={draft.tags} onChange={(event) => update("tags", event.target.value)} placeholder="desert, divine" /></label>
            <label className="form-span-2">Açıklama<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} rows={3} /></label>
            {draft.type === "subclass" ? <><label>Bağlı class<input value={draft.className} onChange={(event) => update("className", event.target.value)} /></label><label>Seçim seviyesi<input type="number" min={1} max={20} value={draft.selectionLevel} onChange={(event) => update("selectionLevel", Number(event.target.value))} /></label></> : null}
            {draft.type === "class" ? <label>Hit Die<input type="number" min={4} max={20} step={2} value={draft.hitDie} onChange={(event) => update("hitDie", Number(event.target.value))} /></label> : null}
            {draft.type === "species" ? <label>Speed<input type="number" min={0} value={draft.speed} onChange={(event) => update("speed", Number(event.target.value))} /></label> : null}
          </div>

          <h3>Custom resource</h3>
          <div className="form-grid">
            <label>Resource adı<input value={draft.resourceName} onChange={(event) => update("resourceName", event.target.value)} placeholder="Kum Zarları" /></label>
            <label>Maksimum<input type="number" min={0} value={draft.resourceMaximum} onChange={(event) => update("resourceMaximum", Number(event.target.value))} /></label>
            <label>Recovery<select value={draft.resourceRecovery} onChange={(event) => update("resourceRecovery", event.target.value as HomebrewCreatorDraft["resourceRecovery"])}><option value="short-rest">Short Rest</option><option value="long-rest">Long Rest</option><option value="dawn">Dawn</option><option value="manual">Manual</option><option value="none">None</option></select></label>
            <label>Recovery miktarı<input type="number" min={0} value={draft.resourceRecoveryAmount} onChange={(event) => update("resourceRecoveryAmount", Number(event.target.value))} /></label>
          </div>

          <h3>Runtime action</h3>
          <div className="form-grid">
            <label>Action adı<input value={draft.actionName} onChange={(event) => update("actionName", event.target.value)} /></label>
            <label>Economy<select value={draft.actionEconomy} onChange={(event) => update("actionEconomy", event.target.value as HomebrewCreatorDraft["actionEconomy"])}><option value="action">Action</option><option value="bonus-action">Bonus Action</option><option value="reaction">Reaction</option><option value="free">Free</option><option value="passive">Passive</option></select></label>
            <label>Resource maliyeti<input type="number" min={0} value={draft.actionCost} onChange={(event) => update("actionCost", Number(event.target.value))} /></label>
            <label className="form-span-2">Mekanik özet<textarea value={draft.actionSummary} onChange={(event) => update("actionSummary", event.target.value)} rows={3} /></label>
          </div>
          <button className="secondary-action" type="button" onClick={stageEntity} disabled={!preview}>İçeriği Pakete Ekle</button>
        </div>

        <div className="homebrew-form-card">
          <h3>Paket önizleme</h3>
          {stagedEntities.length ? <div className="homebrew-list">{stagedEntities.map((entity) => <article className="homebrew-list-item" key={entity.id}><div><span className="mini-label">{ENTITY_LABELS[entity.type]}</span><h3>{entity.name}</h3><p>{entity.description}</p><div className="library-pill-row"><span>{entity.resources?.length ?? 0} resource</span><span>{entity.actions?.length ?? 0} action</span></div></div><button type="button" onClick={() => setStagedEntities((current) => current.filter((item) => item.id !== entity.id))}>Çıkar</button></article>)}</div> : <p>Henüz içerik eklenmedi.</p>}

          <h3>Kayıtlı paketler</h3>
          {packages.map((pkg) => <article className="homebrew-list-item" key={pkg.id}><div><span className="mini-label">v{pkg.version}</span><h3>{pkg.name}</h3><p>{pkg.entities.length} içerik</p></div><div className="homebrew-inline-actions"><button type="button" onClick={() => downloadJson(`${pkg.id}.json`, exportHomebrewPackage(pkg))}>Dışa Aktar</button><button type="button" onClick={() => { const next = packages.filter((item) => item.id !== pkg.id); saveHomebrewPackages(next); setPackages(next); const preferences = normalizeHomebrewLibraryPreferences(next, libraryPreferences); setLibraryPreferences(preferences); saveHomebrewLibraryPreferences(preferences); }}>Sil</button></div></article>)}

          <h3>Paket kütüphanesi ve çakışmalar</h3>
          <p className="homebrew-builder-message">Hazırlık skoru: {marketplace.readinessScore}/100 · {marketplace.conflicts.length} çakışma · {marketplace.activePackages.length} aktif paket</p>
          <div className="homebrew-list">
            {marketplace.entries.map((entry, index) => <article className="homebrew-list-item" key={`library-${entry.package.id}`}>
              <div>
                <span className="mini-label">Öncelik {index + 1} · v{entry.package.version}</span>
                <h3>{entry.package.name}</h3>
                <p>{entry.enabled ? "Aktif" : "Devre dışı"}{entry.updateAvailable ? ` · Güncelleme: ${entry.updateVersion}` : ""}</p>
              </div>
              <div className="homebrew-inline-actions">
                <button type="button" onClick={() => { const next = toggleHomebrewPackage(libraryPreferences, entry.package.id); setLibraryPreferences(next); saveHomebrewLibraryPreferences(next); }}>{entry.enabled ? "Devre Dışı" : "Etkinleştir"}</button>
                <button type="button" disabled={index === 0} onClick={() => { const next = moveHomebrewPackagePriority(libraryPreferences, entry.package.id, "up"); setLibraryPreferences(next); saveHomebrewLibraryPreferences(next); }}>Yukarı</button>
                <button type="button" disabled={index === marketplace.entries.length - 1} onClick={() => { const next = moveHomebrewPackagePriority(libraryPreferences, entry.package.id, "down"); setLibraryPreferences(next); saveHomebrewLibraryPreferences(next); }}>Aşağı</button>
              </div>
            </article>)}
          </div>
          {marketplace.conflicts.length ? <div className="homebrew-list">{marketplace.conflicts.map((conflict) => <article className="homebrew-list-item" key={conflict.key}><div><span className="mini-label">{conflict.type}</span><h3>{conflict.entityId}</h3><p>Kazanan paket: {conflict.winnerPackageId}. Önceliği değiştirdiğinde sonuç anında yenilenir.</p></div></article>)}</div> : <p>Aktif paketlerde içerik çakışması yok.</p>}


          <h3>Marketplace güncelleme ve rollback</h3>
          <textarea value={marketplaceText} onChange={(event) => setMarketplaceText(event.target.value)} rows={6} placeholder='{"format":"e4-dnd-homebrew-share", ...}' />
          <button className="secondary-action" type="button" onClick={applyMarketplaceUpdate} disabled={!marketplaceText.trim()}>Güncellemeleri Güvenli Uygula</button>
          {snapshots.length ? <div className="homebrew-list">{snapshots.map((snapshot) => <article className="homebrew-list-item" key={snapshot.id}><div><span className="mini-label">Snapshot · v{snapshot.version}</span><h3>{snapshot.packageName}</h3><p>{snapshot.reason} · {new Date(snapshot.createdAt).toLocaleString("tr-TR")}</p></div><button type="button" onClick={() => rollbackSnapshot(snapshot.id)}>Bu Sürüme Dön</button></article>)}</div> : <p>Henüz güncelleme snapshot’ı yok.</p>}

          <h3>JSON içe aktar</h3>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={8} placeholder='{"format":"e4-dnd-homebrew", ...}' />
          <button className="secondary-action" type="button" onClick={importPackage} disabled={!importText.trim()}>Paketi İçe Aktar</button>
        </div>
      </div>
    </section>
  );
}
