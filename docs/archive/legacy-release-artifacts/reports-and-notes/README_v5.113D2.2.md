# v5.113D2.2 Spell Casting Mutation Regex Hotfix

Bu paket önceki hotfix'in tam metin eşleşmesi sorununu giderir.

## Düzeltme

`setCharacterConcentration(character, mutation.spellId)` satırı regex ile
bulunur ve açık `set-concentration` discriminant kontrolüne dönüştürülür.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_CASTING_MUTATION_REGEX_HOTFIX_v5.113D2_2.ps1
```
