# v5.111D1 Rest UI Integration Discovery & Contract Gate

Bu paket Rest Center, Character Detail, router, storage ve E2E yapısını
hedefli biçimde keşfeder.

## Amaç

v5.111D2 paketinin yerel proje yapısını tahmin etmeden:

- doğru UI dosyalarını değiştirmesi
- doğru storage API'sine bağlanması
- mevcut route yapısını koruması
- güvenilir desktop/mobile selectorlar kullanması

## Üretilen raporlar

```text
certification-reports/rest-ui-integration-contract-v5.111D1.json
certification-reports/rest-ui-integration-contract-v5.111D1.md
```

JSON raporu şunları içerir:

- Rest Center aday dosyaları
- Character Detail aday dosyaları
- Router adayları
- Storage/save API adayları
- Mevcut test ID'leri
- Route'lar
- Export edilen semboller
- İlgili kod parçaları ve satır numaraları

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Çalıştır:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_UI_INTEGRATION_DISCOVERY_CONTRACT_GATE_v5.111D1.ps1
```

## Sonraki paket

v5.111D2:

- Rest Center runtime bağlantısı
- Character Detail rest işlemleri
- Persistence
- Desktop/mobile E2E
- Final closure audit
