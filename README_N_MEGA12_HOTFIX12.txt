E4 D&D N-MEGA12 HOTFIX12

Düzeltme:
- Windows PowerShell 5.1'de bulunmayan Select-String -Recurse kullanımını kaldırır.
- Aynı doğrulamayı Get-ChildItem -Recurse | Select-String ile yapar.
- E2E bootstrap sürümünü package.json sürümüne eşitler.
- Ancestry + class/background focused testlerini çalıştırır.

Komut:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX12.ps1
