# Level One Action Economy & Resource Readiness v5.86

Bu paket Builder Review ekranına level 1 action economy ve class resource bütünlüğü denetimi ekler.

## Denetlenenler

- Seçilen class kaydı
- Class için beklenen resource kayıtları
- Resource kullanım sınırları ve yinelenen resource ID'leri
- Class action ile resource bağlantıları
- Seçili spell referansları
- Spell Casting Time metadata bütünlüğü
- Action, Bonus Action, Reaction ve Passive seçeneklerinin özeti

## Test kapsamı

Dört hedefli Vitest senaryosu eklenmiştir:

1. Geçerli Fighter resource/action profili
2. Eksik class resource engeli
3. Geçersiz resource kullanımı engeli
4. Reaction spell action economy özeti

## Doğrulama

Bu çalışma ortamında bağımlılıklar bulunmadığı için Vitest ve production build yeniden çalıştırılamadı. Uygulama sonrasında `npm.cmd install`, `npm.cmd test` ve `npm.cmd run build` çalıştırılmalıdır.
