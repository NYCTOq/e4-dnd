E4 D&D N-MEGA12 HOTFIX8

Düzeltme:
- Race & Class form locatorının boşluklu/boşluksuz tüm yazım varyasyonlarını regex ile değiştirir.
- Eski locatorın dosyalarda kalmadığını doğrular.
- İlgili focused desktop E2E testlerini tek worker ile çalıştırır.

Komut:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX8.ps1
