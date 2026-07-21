# E4 D&D v5.65 Class-Based Spell Selection Certification

## Kapsam
- Multiclass karakterlerde class bazlı spell sekmeleri
- Class başına ayrı known/prepared listeleri
- Legacy aggregate spell dizileriyle geriye uyumluluk
- Spell source class kaydı
- Class bazlı Spell Save DC ve Spell Attack görünümü
- Eldritch Knight / Arcane Trickster Wizard spell-list ayrımı
- Subclass Always Prepared spell bağlantısı
- Mobil uyumlu class sekmeleri

## Davranış
- Bir class için yapılan seçim diğer class kotasını değiştirmez.
- `knownSpellIds` ve `preparedSpellIds` geriye uyumluluk için class listelerinin birleşimi olarak korunur.
- `spellSources` her spell'i kaynak class ile eşler.
- Eski karakterlerin düz spell listeleri ilk casting class altında otomatik hydrate edilir.
- Builder tek class karakterlerde de class-map alanlarını üretir.

## Doğrulama
- Vitest: 179 test dosyası, 752 test, 0 hata
- TypeScript build: başarılı
- Vite production build: başarılı
- PWA generateSW: başarılı, 84 precache girdisi
