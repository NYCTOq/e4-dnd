import { useMemo, useState } from "react";
import { createEntityFromDraft, createPackageFromDraft, DEFAULT_HOMEBREW_CREATOR_DRAFT, type HomebrewCreatorDraft } from "../../core/homebrew/homebrewCreator";
import { exportHomebrewPackage, importHomebrewPackage, validateHomebrewPackage, type HomebrewEntity, type HomebrewEntityType, type HomebrewPackage } from "../../core/homebrew/homebrewFoundation";
import { loadHomebrewPackages, saveHomebrewPackages } from "./homebrewStorage";

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
  const [message, setMessage] = useState("");

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
      setStagedEntities([]);
      setMessage(`${pkg.name} kaydedildi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Paket kaydedilemedi.");
    }
  }

  function importPackage() {
    try {
      const pkg = importHomebrewPackage(importText);
      const next = [...packages.filter((item) => item.id !== pkg.id), pkg];
      saveHomebrewPackages(next);
      setPackages(next);
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
          {packages.map((pkg) => <article className="homebrew-list-item" key={pkg.id}><div><span className="mini-label">v{pkg.version}</span><h3>{pkg.name}</h3><p>{pkg.entities.length} içerik</p></div><div className="homebrew-inline-actions"><button type="button" onClick={() => downloadJson(`${pkg.id}.json`, exportHomebrewPackage(pkg))}>Dışa Aktar</button><button type="button" onClick={() => { const next = packages.filter((item) => item.id !== pkg.id); saveHomebrewPackages(next); setPackages(next); }}>Sil</button></div></article>)}

          <h3>JSON içe aktar</h3>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={8} placeholder='{"format":"e4-dnd-homebrew", ...}' />
          <button className="secondary-action" type="button" onClick={importPackage} disabled={!importText.trim()}>Paketi İçe Aktar</button>
        </div>
      </div>
    </section>
  );
}
