# E4 D&D v5.59 — Summon, Companion & Persistent Spell Runtime

## Kapsam

Bu paket aşağıdaki büyüleri 2014 ve 2024 edition farklarıyla yapılandırılmış runtime sistemine bağlar:

- Find Familiar
- Find Steed
- Summon Beast
- Conjure Animals
- Spiritual Weapon
- Flaming Sphere
- Moonbeam

## Temel düzeltmeler

- Find Familiar için tek familiar sınırı, form değiştirme, kendi initiative'i, saldırı yasağı, Touch spell iletimi ve 2014/2024 Action–Bonus Action farkı.
- 2024 Find Steed için slot seviyesine bağlı AC, HP, saldırı, uçuş ve shared initiative metadata'sı.
- Summon Beast için Bestial Spirit form, initiative, command economy ve slot scaling bilgisi.
- 2014 Conjure Animals gerçek Beast stat block summon sistemi ile 2024 spectral pack persistent-area sistemi ayrıldı.
- Spiritual Weapon için 2014 concentration olmaması ve iki slot seviyesinde bir scaling; 2024 concentration ve her slot seviyesinde +1d8 scaling ayrımı.
- Flaming Sphere için Bonus Action hareketi, ram ve end-turn save tetikleri.
- Moonbeam için 2014 enter/start-turn ile 2024 appear/move/enter/end-turn ve once-per-turn farkları.
- Aynı Find Familiar veya Find Steed yeniden kullanıldığında eski persistent effect otomatik değiştirilir.
- Active spell effect kayıtları summon, persistent-area ve persistent-weapon metadata'sını saklar.

## Test sonucu

- Test dosyası: 172 / 172 geçti
- Test: 723 / 723 geçti
- Başarısız test: 0
- Production build: başarılı
- PWA generateSW: başarılı
- Precache: 85 kayıt

## Kurulum

Klasörün içeriğini proje köküne kopyalayın ve mevcut dosyaların üzerine yazın.

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
```
