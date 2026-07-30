E4 D&D N-MEGA12 HOTFIX11

Kök neden:
- E2E testleri release-notes last-seen değerini 6.1.0 yazıyordu.
- Uygulama sürümü 6.2.0 olduğu için release notes popup'ı her testte açılıyor ve builder tıklamalarını engelliyordu.

Bu paket:
- package.json sürümünü okur.
- Bütün e2e dosyalarındaki __E4_E2E_APP_VERSION__ sabitlerini günceller.
- Bütün e4_dnd_last_seen_version_v1 doğrudan yazımlarını günceller.
- Eski 6.1.0 bootstrap kalmadığını doğrular.
- Ancestry + class/background focused desktop testlerini tek worker ile çalıştırır.

Komut:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX11.ps1
