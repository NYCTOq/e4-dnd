# v5.96 Advancement E2E Selector Hotfix

Bu hotfix uygulama runtime kodunu değiştirmez. Yalnız Playwright test seçicilerini düzeltir.

Düzeltmeler:

- Karakter adı artık tekil `h1` heading üzerinden doğrulanır.
- Kapalı Level Up `<details>` bölümü test tarafından açılır.
- Level 1 testi görünür Level Up butonunu bölüm içinde arar.
- Level 20 testi görünür `.level-cap-card` ve onun `strong` başlığını doğrular.
- Mobilde gizli ilk metin eşleşmesine takılma kaldırılır.

Doğrulama:

```powershell
npm.cmd run test:e2e:advancement
```
