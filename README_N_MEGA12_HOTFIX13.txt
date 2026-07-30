E4 D&D N-MEGA12 HOTFIX13

Kök neden:
- Tam E2E çalışmasında 535 test geçti, 3 test skip edildi.
- Kalan 4 test aynı play-feedback dosyasında Türkçe UTF-8 mojibake nedeniyle kırıldı.
- Kullanıcı metinleri "uygulandÄ±" ve "Ä°yileÅŸtirme" biçiminde render edildi.

Bu paket:
- src altındaki bilinen bozuk feedback metinlerini doğru Türkçe UTF-8 metinlerle değiştirir.
- Dosyaları UTF-8 BOM'suz yazar.
- Bozuk metin kalmadığını doğrular.
- Yalnızca desktop + mobile play-feedback testlerini yeniden çalıştırır.

Komut:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX13.ps1
