E4 D&D N-MEGA12 DIAGNOSTIC15

Düzeltme:
- PowerShell değişkeninden hemen sonra gelen ':' karakterinin oluşturduğu parser hatasını giderir.
- Test çalıştırmaz.
- Dosya değiştirmez.
- Feedback encoding kaynağını src, e2e ve dist içinde tarar.
- N_MEGA12_FEEDBACK_ENCODING_DIAG.txt üretir.

Komut:
powershell -ExecutionPolicy Bypass -File .\RUN_N_MEGA12_DIAG15.ps1
