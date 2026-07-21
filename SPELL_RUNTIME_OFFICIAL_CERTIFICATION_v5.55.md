# E4 D&D Spell Runtime Official Certification v5.55

## Kapsam

Bu paket 2024 spell runtime çekirdeğinde doğrulanan edition farklarını uygular.

- Cure Wounds: 2d8 + spellcasting ability modifier, slot başına +2d8.
- Healing Word: 2d4 + spellcasting ability modifier, slot başına +2d4.
- Counterspell: Constitution saving throw tabanlı revised davranış.
- Spiritual Weapon: Concentration, slot başına +1d8 ve spellcasting ability modifier.
- Barkskin: Bonus Action, Concentration yok, 1 saat, AC minimum 17.
- True Strike: revised weapon attack yönlendirmesi ve level 5/11/17 radiant scaling.
- Global runtime: açıklamasında spellcasting ability modifier bulunan damage/healing büyülerine modifier uygulanır.

## Test sonucu

- 168 test dosyası geçti.
- 693 test geçti.
- 0 başarısız test.
- TypeScript ve Vite production build başarılı.
- PWA generateSW başarılı, 85 precache girdisi.

## Sınır

Bu paket kritik revised spell runtime çekirdeğini kapatır. Bütün 2024 spell kataloğunun yüzlerce büyüsünü tek tek semantik olarak sertifikalandırmaz. Sonraki paketlerde damage, healing, control, summon ve reaction büyüleri gruplar halinde devam etmelidir.
