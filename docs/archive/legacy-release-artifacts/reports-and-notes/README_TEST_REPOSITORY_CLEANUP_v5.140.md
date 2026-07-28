# E4 D&D v5.140 — Test & Repository Cleanup

Bu paket proje kökündeki tarihsel sürüm belgelerini ve eski APPLY scriptlerini `docs/archive/legacy-release-artifacts` altına taşır. Çalışan kaynak kodu, E2E dosyaları, aktif testler ve ayrıntılı eski package scriptleri silinmez.

## Yeni ana komutlar

- `npm.cmd run test:unit`
- `npm.cmd run test:critical`
- `npm.cmd run test:release`
- `npm.cmd run certify`
- `npm.cmd run audit:repository`

## Üretilen kayıt

- `docs/archive/legacy-release-artifacts/ARCHIVE_INDEX.md`
- `reports/REPOSITORY_CLEANUP_v5.140.json`

## Uygulama

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_TEST_REPOSITORY_CLEANUP_v5.140.ps1
```
