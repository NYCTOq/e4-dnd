# E4 D&D v6.1D2.2 Final Responsive Test Cleanup

D2.1 sonrasında kalan test kaynaklı sorunları kapatır:

- `app-shell` içindeki ikinci skip-link testi, başarıyla geçen accessibility testiyle çakışmayacak şekilde Alt+0 doğrulamasına çevrilir.
- Builder class journey testindeki mevcut olmayan `Class` başlığı beklentisi kaldırılır.
- Select, button, radio veya card tabanlı class seçim yüzeyleri desteklenir.
- `patch_payload/e2e/*.spec.ts` kopyaları silinir; Vitest artık Playwright dosyalarını unit test sanmaz.
- package.json BOM'suz tutulur.
- Hedefli E2E, unit, build ve tam E2E çalıştırılır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_RESPONSIVE_TEST_CLEANUP_v6.1D2.2.ps1
```
