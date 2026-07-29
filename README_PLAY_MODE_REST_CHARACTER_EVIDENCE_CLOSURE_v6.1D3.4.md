# E4 D&D v6.1D3.4 Play Mode & Rest Character Evidence Closure

D3.3 sonrasında hedefli 18 testten 16'sı geçti. Kalan iki hata aynı senaryonun desktop ve mobile kopyalarıydı.

- Karakter detay sayfasında isim canonical H1 olarak doğrulanıyor.
- Play Mode ve Rest sayfalarında karakter adı görünür ancak H1 olmak zorunda değil.
- Bu paket Play Mode ve Rest kanıtını ilk görünür tam metin eşleşmesi üzerinden doğrular.
- Staging klasörlerindeki yinelenen test kopyalarını temizler.
- Hedefli karakter yolculuğu, tam unit suite, build ve tam E2E çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAY_MODE_REST_CHARACTER_EVIDENCE_CLOSURE_v6.1D3.4.ps1
```
