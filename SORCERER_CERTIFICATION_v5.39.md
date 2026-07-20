# E4 D&D v5.39 — Sorcerer 2014/2024 Builder Certification

## Kapsam

- 2014: 9 race × 8 published Sorcerous Origin × 20 level = **1.440 senaryo**
- 2024: 10 species × 4 Player's Handbook subclass × 20 level = **800 senaryo**
- Toplam: **2.240 Sorcerer Builder senaryosu**

## Düzeltilen kritik kurallar

### Spell progression ayrımı
- 2014 Sorcerer `Spells Known` tablosunu kullanır: L1 2, L10 11, L17–20 15.
- 2024 Sorcerer `Prepared Spells` tablosunu kullanır: L1 2, L10 15, L17 19, L20 22.
- Edition verileri birbirine sızdırılmaz.

### Sorcery Points ve Flexible Casting
- L1: 0 Sorcery Point.
- L2–20: maksimum Sorcery Point, Sorcerer level'a eşittir.
- Slot üretim maliyetleri 2/3/5/6/7 olarak korunur.
- 2024 minimum Sorcerer level şartları L2/L3/L5/L7/L9 olarak doğrulanır.
- Yalnız harcanmış slot geri üretilebilir; level 6+ slot üretilemez.

### Metamagic
- 2014: L3 2 seçenek, L10 3 seçenek, L17 4 seçenek.
- 2024: L2 2 seçenek, L10 4 seçenek, L17 6 seçenek.
- 2024 Seeking Spell ve Transmuted Spell kataloğa eklendi.
- Heightened Spell maliyeti edition-aware: 2014 3 SP, 2024 2 SP.
- Twinned Spell 2014 ve 2024 davranışları ayrı kayıtlar olarak tutulur.

### 2024 class özellikleri
- L1 Innate Sorcery: 2 Long Rest kullanımı.
- L5 Sorcerous Restoration: Short Rest başına bir kez, Sorcerer level'ın yarısına kadar SP.
- L7 Sorcery Incarnate.
- L19 Epic Boon.
- L20 Arcane Apotheosis.
- 2024 weapon proficiency `Simple Weapons` olarak düzeltildi.

## Subclass kapsamı

### 2014
Draconic Bloodline, Wild Magic, Storm Sorcery, Divine Soul, Shadow Magic, Aberrant Mind, Clockwork Soul ve Lunar Sorcery.

Bütün subclasslarda L1, L6, L14 ve L18 checkpointleri doğrulandı. Bir subclass aynı seviyede birden fazla özellik veriyorsa tüm özellikler katalogda ayrı tutulur.

### 2024
Draconic Sorcery, Wild Magic Sorcery, Aberrant Sorcery ve Clockwork Sorcery.

Bütün subclasslarda L3, L6, L14 ve L18 checkpointleri doğrulandı. Wild Magic Sorcery için eksik olan L14 Controlled Chaos checkpointi eklendi.

## Regresyon koruması

- Draconic 2014 ve 2024 capstone adları ayrı tutulur.
- Wild Magic 2014 Spell Bombardment ve 2024 Tamed Surge ayrılır.
- 2014 subclasslar L1'den, 2024 subclasslar L3'ten önce görünmez.
- Arcane class runtime 2024 L17 Metamagic sayısını 6 olarak bekler.

## Açık kalan ortak Origin uyarıları

Bu paket Sorcerer progression blockerlarını kapatır. 2014 subrace seçimleri ve 2024 species alt seçimleri ortak Origin Builder işinde ayrıca çözülecektir.

## Kaynak notu

2024 temel class progression ve açık Draconic Sorcery kuralları resmî Free Rules ile çapraz kontrol edilmiştir. Genişletilmiş 2014 subclass kayıtları mekanik özet ve checkpoint düzeyinde tutulur; kitap metinleri kopyalanmaz.

## Doğrulama

- 150 test dosyası
- 604 test
- Yeni Sorcerer sertifikası: 8/8
- Bütün testler başarılı
- TypeScript/Vite/PWA production build başarılı
