# E4 D&D Single-Class Builder Final Certification v5.71

## Amaç

Bu paket, multiclass kapalıyken mevcut 2014 ve 2024 kataloglarında tek sınıflı karakter üretiminin veri ve progression bütünlüğünü tek bir release-gate testi altında doğrular.

## Kapsam

- 12 ana sınıf
- 2014: 9 PHB race
- 2024: 10 PHB species
- Katalogdaki tüm subclasslar
- Level 1-20
- Subclass seçim seviyeleri
- Subclass özelliklerinin seçim seviyesinden önce açılmaması
- Class progression satırları, class-specific spell/resource/feature sertifikasyonları

## Sertifikasyon matrisi

- 2014: 13.140 race × subclass × level senaryosu
- 2024: 9.600 species × subclass × level senaryosu
- Toplam: 22.740 tek sınıf Builder senaryosu
- Blocker: 0

## Eklenen test

`src/core/rulesets/singleClassBuilderFinalCertification.integration.test.ts`

Bu test tüm class-specific Builder certifier modüllerini tek kapıda çalıştırır. Her edition için 12 sınıfın tamamının hazır olmasını, blocker üretmemesini ve subclass seviyelerinin class verisiyle eşleşmesini zorunlu tutar.

## Doğrulama sonucu

```text
179 test dosyası geçti
753 test geçti
0 başarısız test
```

```text
TypeScript başarılı
Vite production build başarılı
628 modül işlendi
PWA generateSW başarılı
86 precache girdisi
```

## Dürüst kapsam sınırı

Bu sertifika mevcut uygulama kataloğundaki race/species ve subclass kayıtlarını kapsar. Tüm ek kitaplarda yayımlanmış her resmî 2014 seçeneğinin katalogda bulunduğu anlamına gelmez. Ayrıca otomatik veri/progression sertifikasyonu, gerçek tarayıcıdaki bütün seçim yollarının elle veya Playwright ile uçtan uca tıklandığı anlamına gelmez.

## Kaynak taban

Yüklenen tam proje `package.json` içinde `5.64.0` sürümündeydi. Bu paket yeni test ve sürüm dosyalarını bu kaynak tabanına göre üretmiştir. Daha sonraki patchler yerelde uygulanmışsa dosyalar hedef proje üzerine birleştirilmelidir.
