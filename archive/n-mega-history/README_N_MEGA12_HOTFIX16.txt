E4 D&D N-MEGA12 HOTFIX16

Gerçek kök neden:
1. Bozuk Türkçe metinler doğrudan src/features/play-mode/PlayMode.tsx içindeydi.
2. Playwright vite preview kullandığı için mevcut dist klasörünü test ediyordu.
3. Kaynak değişse bile npm build çalışmadan eski bozuk bundle test edilmeye devam ediyordu.

Bu paket:
- PlayMode.tsx içindeki bilinen mojibake metinlerini Unicode kod noktalarıyla güvenli biçimde düzeltir.
- Bozuk metin kalmadığını doğrular.
- npm.cmd run build çalıştırarak dist'i yeniler.
- Yalnızca kalan 4 play-feedback desktop/mobile testini çalıştırır.

Komut:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX16.ps1
