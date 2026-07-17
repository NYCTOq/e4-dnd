# v5.0.0 — Stable Player Release

- E4 D&D player journey is promoted to the stable release channel.
- A single stable manifest now combines hardening, runtime coverage, player journey, data integrity, localization, accessibility and licensing gates.
- Version mismatch, missing runtime behavior, failed migration, unresolved crash, invalid backup or failed test/build/browser gates block the release.
- The manifest exposes stable status, readiness score, blockers, warnings and explicit player guarantees.

# v4.12.0 — Stable Player Release Hardening Mega Pack

- Unit/integration, production build and browser E2E release gates were unified.
- Current and legacy full backups are parsed, hydrated and certified before restore.
- Detached rollback backups protect restore workflows from accidental shared mutation.
- Migration failures and unresolved crash records are hard release blockers.
- Recovery quarantine records are visible release warnings instead of silent data loss.

# v4.9.0 — Equipment & Magic Item Closure Mega Pack

- Starting equipment ve pack içeriklerini duplicate üretmeden envantere ekleyen ortak runtime
- Weapon property kombinasyonlarının normalize edilmesi
- Attunement sınırı ve uygunluk raporu
- Charge kullanımı, kalan kullanım ve item spell casting planı
- Curse etiketi, item save DC ve attack bonus fallback desteği
- Encumbrance, ağırlık, kapasite ve kalan taşıma alanının tek özette birleştirilmesi
- Yeni equipment closure sertifikasyon testleri

# v4.8.0 — Player Journey Consistency Mega Pack

- Builder, Editor, Detail, Character Sheet ve Play Mode için merkezi karakter snapshot motoru.
- AC, initiative, speed, passive Perception, skill/save, spell DC/attack ve attacks-per-action ortak hesap kaynağı.
- Ruleset verisinden spellcasting ability çözümü.
- Resource remaining/recovery görünümü ve snapshot tutarlılık denetimi.
- Mevcut armor helper fonksiyonları merkezi hesap katmanına bağlandı.

# v4.7.0 — Unified Character Choices Mega Pack

- Builder, Level Up, Character Editor ve Choice Debt Resolver için ortak seçim modeli eklendi.
- Subclass, Fighting Style, Weapon Mastery, Metamagic, Invocation, Wild Shape, Maneuver, Companion, Expertise ve Mystic Arcanum tek runtime kataloğunda birleştirildi.
- Seçim limitleri, prerequisite filtreleri, geçerli seçim sayısı ve eksik seçim borcu aynı kaynaktan hesaplanıyor.
- Tekli, çoklu ve spell-level gruplu seçimler için ortak uygulama motoru eklendi.
- Choice Debt Resolver tekrar eden class-specific seçenek kodlarından arındırıldı.
- Yeni unified choice sertifikasyon testleri eklendi.

# v4.6.0 — Full Character Certification Mega Pack

- 12 class × 2 edition için 24 kombinasyonluk sertifikasyon matrisi eklendi.
- Her class için kritik level, subclass unlock, spell progression ve level 20 capstone doğrulaması eklendi.
- Level 1–20 içerik/referans sertifikası ile runtime coverage tek üst raporda birleştirildi.
- Character integrity ve create → level up → rest → backup restore lifecycle sertifika yardımcıları eklendi.
- Gerçek 2014/2024 veri paketleriyle entegrasyon matrisi ve regresyon testleri eklendi.

## v4.5.0 — Global Spell Runtime Mega Pack (17 Temmuz 2026)

- Damage, healing, spell attack ve saving throw çözümünü ortak global runtime altında birleştirdi.
- Slot/cantrip scaling, upcast hedef artışı ve normal + Pact Magic slot seçeneklerini ortaklaştırdı.
- Full/half/zero save sonuçları, healing cap ve overheal raporu eklendi.
- Concentration değiştirme/bitirme, repeat-save, condition effect ve süre takibi güçlendirildi.
- AoE, summon, movement, reaction, ritual ve material gereksinimleri için tek davranış planı eklendi.
- Dispel/effect temizleme yardımcıları ve global spell runtime sertifikasyon testleri eklendi.

## v4.4.0 — Arcane Classes Mega Pack (17 Temmuz 2026)

- Bard, Sorcerer, Warlock ve Wizard için 2014/2024 ortak arcane runtime matrisi.
- Bardic Inspiration die, kullanım ve recovery progression sertifikası.
- Sorcery Points, Metamagic, Pact Magic, Invocation ve Mystic Arcanum progression.
- Wizard Arcane Recovery, Spell Mastery ve Signature Spells doğrulaması.
- College of Valor, Wild Magic, Great Old One ve Abjurer subclass runtime bağlantıları.

# E4 D&D Releases

## 1.8.0

Locations + World Atlas, mekân hiyerarşisi ve NPC bağlantıları.


## Uygulama sürümünü yükseltme

`package.json` ve `package-lock.json` içindeki sürüm numarası birlikte güncellenir.

Örnek:

```powershell
npm.cmd version patch --no-git-tag-version
npm.cmd run check
git add .
git commit -m "release: prepare v1.0.1"
git push
```

## GitHub Release oluşturma

Hazırlık commit'i `main` branch'ine gönderildikten sonra tag oluşturulur:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

`Release` workflow'u otomatik olarak:

1. Bağımlılıkları kurar.
2. Lint, test ve production build çalıştırır.
3. `dist` klasörünü zipler.
4. GitHub Releases bölümünde otomatik sürüm kaydı oluşturur.
5. Production zip dosyasını release'e ekler.

## Uygulama içi sürüm notları

Yeni sürüm için `src/shared/release/releaseNotes.ts` dosyasına en üste yeni kayıt eklenir. Kullanıcı yeni sürümü ilk açtığında notlar bir defa otomatik gösterilir.

## v4.10.0 — Browser E2E & Mobile QA Foundation Mega Pack
- Playwright desktop Chromium and Pixel 7 mobile projects.
- Direct-route smoke coverage for Dashboard, Characters, Builder, Play Mode and Backup.
- Keyboard skip-link, mobile navigation, refresh persistence and offline PWA shell scenarios.
- Shared QA certification manifest for browser, mobile, PWA and data layers.
- Added `test:e2e`, `test:e2e:headed`, `test:e2e:mobile` and `check:full` scripts.
- Browser specs are compile-checked; final execution requires a local Playwright browser that can access the preview server.
