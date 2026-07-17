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

## Browser E2E and mobile QA
```powershell
npx.cmd playwright install chromium
npm.cmd run build
npm.cmd run test:e2e
```
Use `npm.cmd run test:e2e:mobile` for the mobile project or `npm.cmd run check:full` for the complete chain.
