import { useState } from "react";
import type { Character, CharacterCondition } from "../../core/character/character.types";
import { applyPlayStatusAction, getPlayStatusSummary } from "../../core/rulesets/playStatusRuntime";

const CONDITIONS: CharacterCondition[] = ["Blinded","Charmed","Deafened","Frightened","Grappled","Incapacitated","Invisible","Paralyzed","Petrified","Poisoned","Prone","Restrained","Stunned","Unconscious","Concentration","Rage","Cursed"];

export function PlayStatusRuntimePanel({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  const [amount, setAmount] = useState(1);
  const summary = getPlayStatusSummary(character);
  const act = (action: Parameters<typeof applyPlayStatusAction>[1]) => onChange(applyPlayStatusAction(character, action));
  return <section className="play-mode-card play-status-runtime-panel">
    <div className="play-mode-section-head"><div><span className="mini-label">Character State</span><h2>HP, Durum ve Kaynaklar</h2></div><strong>{summary.dead ? "Ölü" : summary.stable ? "Stabil" : summary.dying ? "Ölüm Save" : "Hazır"}</strong></div>
    <div className="spell-target-console"><label>Miktar<input type="number" min="1" value={amount} onChange={(event)=>setAmount(Math.max(1,Number(event.target.value)||1))}/></label><button type="button" onClick={()=>act({type:"damage",amount})}>Hasar</button><button type="button" onClick={()=>act({type:"heal",amount})}>İyileştir</button><button type="button" onClick={()=>act({type:"temp-hp",amount})}>Temp HP</button></div>
    <div className="play-mode-roll-history"><div><span>HP<small>Temporary HP: {character.tempHp}</small></span><strong>{summary.hp}</strong></div><div><span>Death Saves<small>{character.deathSaves.successes} başarı · {character.deathSaves.failures} başarısız</small></span><strong>{summary.dying ? "Aktif" : "-"}</strong></div><div><span>Exhaustion</span><strong>{character.exhaustion}</strong></div></div>
    <div className="play-mode-rest-actions"><button type="button" onClick={()=>act({type:"death-save-success"})}>Death Save Başarı</button><button type="button" onClick={()=>act({type:"death-save-failure"})}>Death Save Hata</button><button type="button" onClick={()=>act({type:"death-save-failure",critical:true})}>Nat 1 / İki Hata</button><button type="button" onClick={()=>act({type:"stabilize"})}>Stabilize</button><button type="button" onClick={()=>act({type:"reset-death-saves"})}>Save Sıfırla</button></div>
    <label>Exhaustion <input type="range" min="0" max="6" value={character.exhaustion} onChange={(event)=>act({type:"set-exhaustion",level:Number(event.target.value)})}/><strong>{character.exhaustion}</strong></label>
    <div className="condition-chip-list">{CONDITIONS.map(condition=><button type="button" className={character.conditions.includes(condition)?"active":""} key={condition} onClick={()=>act({type:"toggle-condition",condition})}>{condition}</button>)}</div>
    {character.resources.length ? <div className="play-mode-roll-history">{character.resources.map(resource=><div key={resource.id}><span>{resource.name}<small>{resource.recovery} rest</small></span><strong>{resource.unlimited?"∞":`${resource.max-resource.used}/${resource.max}`}</strong><button type="button" disabled={resource.unlimited||resource.used>=resource.max} onClick={()=>act({type:"spend-resource",resourceId:resource.id})}>Kullan</button><button type="button" disabled={resource.unlimited||resource.used<=0} onClick={()=>act({type:"recover-resource",resourceId:resource.id})}>Geri Al</button></div>)}</div>:null}
  </section>;
}
