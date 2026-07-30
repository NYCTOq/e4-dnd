import { useEffect, useMemo, useState } from "react";
import {
  addGuidedFeature,
  loadGuidedFeatures,
  recoverGuidedFeatures,
  removeGuidedFeature,
  saveGuidedFeatures,
  spendGuidedFeatureUse,
  toggleGuidedFeature,
  type FeatureEconomy,
  type FeatureRecovery,
  type GuidedFeatureState,
} from "../../core/runtime/guidedFeatureRuntime";

export function GuidedFeatureControlPanel({ characterId }: { characterId: string }) {
  const [features, setFeatures] = useState<GuidedFeatureState[]>(() => loadGuidedFeatures(characterId));
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [recovery, setRecovery] = useState<FeatureRecovery>("long-rest");
  const [economy, setEconomy] = useState<FeatureEconomy>("action");
  const [notes, setNotes] = useState("");

  useEffect(() => setFeatures(loadGuidedFeatures(characterId)), [characterId]);
  useEffect(() => saveGuidedFeatures(characterId, features), [characterId, features]);
  const activeCount = useMemo(() => features.filter((item) => item.active).length, [features]);

  const addFeature = () => {
    const clean = name.trim();
    if (!clean) return;
    const id = `${clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    setFeatures((current) => addGuidedFeature(current, { id, name: clean, source, maxUses, recovery, economy, notes }));
    setName(""); setNotes("");
  };

  return <section className="play-mode-card">
    <div className="play-mode-section-head"><div><span className="mini-label">Guided & Manual Runtime</span><h2>Özellik Kullanım Merkezi</h2></div><strong>{features.length} özellik · {activeCount} aktif</strong></div>
    <p className="muted-copy">Otomatikleştirilemeyen class, subclass, feat, species ve eşya özelliklerini kullanım hakkı, aksiyon türü, aktif durum ve dinlenme yenilemesiyle takip et.</p>
    <div className="spell-target-console">
      <label>Özellik<input value={name} onChange={(event)=>setName(event.target.value)} placeholder="Channel Divinity, Lucky..." /></label>
      <label>Kaynak<input value={source} onChange={(event)=>setSource(event.target.value)} placeholder="Cleric, feat, item..." /></label>
      <label>Maks. kullanım<input type="number" min="0" max="99" value={maxUses} onChange={(event)=>setMaxUses(Math.max(0, Number(event.target.value)||0))}/></label>
      <label>Yenilenme<select value={recovery} onChange={(event)=>setRecovery(event.target.value as FeatureRecovery)}><option value="short-rest">Short Rest</option><option value="long-rest">Long Rest</option><option value="dawn">Dawn</option><option value="manual">Manuel</option></select></label>
      <label>Aksiyon<select value={economy} onChange={(event)=>setEconomy(event.target.value as FeatureEconomy)}><option value="action">Action</option><option value="bonus-action">Bonus Action</option><option value="reaction">Reaction</option><option value="passive">Passive</option><option value="other">Other</option></select></label>
      <label>Not<input value={notes} onChange={(event)=>setNotes(event.target.value)} placeholder="Save DC, hedef, masa kararı..." /></label>
      <button type="button" onClick={addFeature}>Özellik Ekle</button>
    </div>
    <div className="play-mode-rest-actions"><button type="button" onClick={()=>setFeatures((current)=>recoverGuidedFeatures(current,"short-rest"))}>Short Rest Yenile</button><button type="button" onClick={()=>setFeatures((current)=>recoverGuidedFeatures(current,"long-rest"))}>Long Rest Yenile</button><button type="button" onClick={()=>setFeatures((current)=>recoverGuidedFeatures(current,"dawn"))}>Dawn Yenile</button><button type="button" onClick={()=>setFeatures((current)=>recoverGuidedFeatures(current,"all"))}>Tümünü Yenile</button></div>
    <div className="play-mode-class-actions">{features.length===0?<p>Henüz manuel veya guided özellik eklenmedi.</p>:features.map((feature)=><div className="play-mode-slot-row" key={feature.id}><div><span>{feature.name}{feature.active?" · Aktif":""}</span><small>{feature.source} · {feature.economy} · {feature.maxUses===0?"sınırsız":`${feature.maxUses-feature.used}/${feature.maxUses}`} · {feature.recovery}{feature.notes?` · ${feature.notes}`:""}</small></div>{feature.maxUses>0?<button type="button" disabled={feature.used>=feature.maxUses} onClick={()=>setFeatures((current)=>spendGuidedFeatureUse(current,feature.id))}>Kullan</button>:null}<button type="button" onClick={()=>setFeatures((current)=>toggleGuidedFeature(current,feature.id))}>{feature.active?"Bitir":"Aktifleştir"}</button><button type="button" onClick={()=>setFeatures((current)=>removeGuidedFeature(current,feature.id))}>Sil</button></div>)}</div>
  </section>;
}
