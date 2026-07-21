# Level One Proficiency Readiness v5.76

Bu paket tek sınıf level 1 Builder akışına skill ve proficiency hazırlık denetimi ekler.

## Denetimler

- Class skill seçim kotası eksiksiz olmalı.
- Background tarafından verilen skilller class kotasını tüketmez.
- Duplicate skill kayıtları engellenir.
- Expertise yalnız proficient olunan skilllerde geçerlidir.
- Tool ve language listelerinde tekrar eden kayıtlar yakalanır.
- Class saving throw, armor ve weapon proficiency özeti Review ekranında gösterilir.

## Değişen dosyalar

- `src/core/rulesets/levelOneProficiencyReadiness.ts`
- `src/core/rulesets/levelOneProficiencyReadiness.test.ts`
- `src/features/builder/Builder.tsx`
- `package.json`
- `package-lock.json`
