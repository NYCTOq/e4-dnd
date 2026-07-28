# v5.113D2.1 Spell Casting Mutation Discriminant Hotfix

## Kök neden

TypeScript, caster mutation union içindeki son dalın kesin olarak
`set-concentration` olduğunu daraltamadı.

## Düzeltme

Son dönüş açık bir discriminant kontrolüne bağlandı:

```ts
if (mutation.type === "set-concentration") {
  return setCharacterConcentration(
    character,
    mutation.spellId,
  );
}
```

## Etki

- Runtime davranışı değişmez.
- Slot davranışı değişmez.
- Concentration davranışı değişmez.
- Yalnızca TypeScript union narrowing düzeltilir.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_CASTING_MUTATION_DISCRIMINANT_HOTFIX_v5.113D2_1.ps1
```
