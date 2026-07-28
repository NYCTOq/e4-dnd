# E4 D&D v5.128 Release Hardening Mega

## Gerçek değişiklikler
- Ana bundle için manuel chunk ayrımı: React/router, shell ve büyük D&D veri genişletmeleri ayrı paketlenir.
- 500 kB üstü ana giriş paketi için 450 kB release bütçesi eklenir.
- Tek merkezi release runner: unit -> build -> artifact audit -> kritik E2E.
- Aynı build'i tekrar tekrar çağıran yeni zincirler yerine tek deterministic kapı kullanılır.
- Desktop/mobile üzerinde kritik route, page-error ve yatay taşma kontrolü yapılır.
- E2E global state mevcut `installKnownAppState` fixture'ıyla izole edilir.

## Çalıştırma
```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_RELEASE_HARDENING_MEGA_v5.128.ps1
```
