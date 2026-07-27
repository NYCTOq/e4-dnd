# v5.113C.1 Spell Concentration Matrix Type Hotfix

## Kök neden

TypeScript, aşağıdaki jenerik çağrının dönüş tipini yalnızca `{ id: string }`
olarak korudu:

```ts
setCharacterConcentration({ id: "caster" }, spellId)
```

Runtime nesneye `concentrating` ve `concentrationSpellId` alanlarını ekliyordu,
ancak test derlenirken bu alanlar tip üzerinde görünmüyordu.

## Düzeltme

Girdi nesnesi açıkça `SpellCompatibleCharacter` olarak tanımlanır.

## Etki

- Runtime davranışı değişmez.
- Concentration davranışı değişmez.
- Test mantığı değişmez.
- Yalnızca TypeScript tip çözümlemesi düzeltilir.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_CONCENTRATION_MATRIX_TYPE_HOTFIX_v5.113C_1.ps1
```
