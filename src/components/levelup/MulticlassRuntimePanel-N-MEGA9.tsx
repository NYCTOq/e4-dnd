
import {useMemo,useState} from 'react';
import {MULTICLASS_CLASS_OPTIONS,applyRuntimeMulticlassLevel,getRuntimeMulticlassEligibility,type MulticlassRuntimeCharacter} from '../../core/rulesets/multiclassAdvancementRuntime-N-MEGA9';
export default function MulticlassRuntimePanel<T extends MulticlassRuntimeCharacter>({character,onCharacterChange}:{character:T;onCharacterChange:(c:T)=>void}){
 const current=new Set((character.classes??[]).map(x=>x.classId.toLowerCase())); const available=MULTICLASS_CLASS_OPTIONS.filter(x=>!current.has(x.id)); const [target,setTarget]=useState(available[0]?.id??''); const eligibility=useMemo(()=>target?getRuntimeMulticlassEligibility(character,target):{eligible:false,missing:['No class available']},[character,target]); const [message,setMessage]=useState('');
 if(!available.length||Number(character.level??1)>=20)return null;
 const apply=()=>{const result=applyRuntimeMulticlassLevel(character,target);if(!result.ok){setMessage(result.errors.join(' · '));return}onCharacterChange(result.character);setMessage('Multiclass level applied.');};
 return <section className="multiclass-runtime-panel" data-testid="multiclass-runtime-panel"><h3>Yeni Sınıfa Geç</h3><select value={target} onChange={e=>{setTarget(e.target.value);setMessage('')}} data-testid="multiclass-class-select">{available.map(x=><option key={x.id} value={x.id}>{x.name} (d{x.hitDie})</option>)}</select>{!eligibility.eligible&&<p data-testid="multiclass-errors">{eligibility.missing.join(' · ')}</p>}<button type="button" disabled={!eligibility.eligible} onClick={apply} data-testid="multiclass-apply">Multiclass Seviyesi Al</button>{message&&<p>{message}</p>}</section>;
}
