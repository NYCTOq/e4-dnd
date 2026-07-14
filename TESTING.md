# E4 D&D Test Altyapısı

## Komutlar

```powershell
npm.cmd test
npm.cmd run test:watch
npm.cmd run build
```

## Mevcut test kapsamı

- Encounter XP / difficulty hesapları
- Level-up HP, ASI, spell slot ve hit dice güncellemeleri
- Zar notasyonu, sınırlandırma ve toplam hesapları
- Full Backup V1/V2 doğrulama ve migration
- Backup birleştirme davranışı
- Eski campaign kayıtlarının güvenli migration'ı

Yeni bir helper veya migration eklendiğinde aynı klasörde `*.test.ts` dosyası oluşturulmalıdır.
