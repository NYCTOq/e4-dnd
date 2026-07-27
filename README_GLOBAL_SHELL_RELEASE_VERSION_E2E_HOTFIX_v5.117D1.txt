E4 D&D — Global Shell Release Version E2E Hotfix v5.117D1

Sorun:
global-shell-overlay-safety-v5.116.spec.ts, tamamlanmış overlay senaryosunda
son görülen sürümü sabit "5.116.3" olarak yazıyordu. Uygulama 5.117.3'e
ilerlediğinde Release Notes doğru biçimde açılıyor ve Karakterler bağlantısına
yapılan fiziksel tıklamayı engelliyordu.

Çözüm:
E2E testi aktif uygulama sürümünü package.json içinden okur. Böylece yeni bir
sürüm yayınlandığında aynı test tekrar eskimez.

Uygulama:
1. ZIP'i D:\Projects\e4_dnd klasörüne çıkarın.
2. Aynı adlı dosyanın üzerine yazılmasına izin verin.
3. Proje kökünde şunu çalıştırın:

   powershell -ExecutionPolicy Bypass -File .\APPLY_GLOBAL_SHELL_RELEASE_VERSION_E2E_HOTFIX_v5.117D1.ps1

Beklenen:
4 passed

