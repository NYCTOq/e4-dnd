E4 D&D N-MEGA12 DIAGNOSTIC14

Bu paket test çalıştırmaz ve dosya değiştirmez.

Amaç:
- Feedback metninin üretildiği gerçek kaynak satırlarını bulmak.
- decodeURIComponent, TextDecoder, escape/unescape, atob/btoa gibi muhtemel çift-encoding zincirlerini göstermek.
- src, e2e ve dist içindeki doğru/bozuk Türkçe metinleri karşılaştırmak.
- Sonucu N_MEGA12_FEEDBACK_ENCODING_DIAG.txt dosyasına yazmak.

Komut:
powershell -ExecutionPolicy Bypass -File .\RUN_N_MEGA12_DIAG14.ps1
