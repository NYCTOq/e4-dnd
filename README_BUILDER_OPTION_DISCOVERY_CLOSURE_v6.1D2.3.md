# E4 D&D v6.1D2.3 Builder Option Discovery Closure

Kalan sekiz Builder testi, Class kontrolünün label ve DOM tipini tahmin ettiği için başarısız oluyordu.

Bu paket:

- Class adımındaki bütün `<select>` kontrollerinin option metinlerini tarar.
- İstenen class seçeneğini gerçekten içeren select'i bulup seçer.
- Select yoksa button, radio veya tam metin seçimine düşer.
- `patch_payload` altındaki bütün Playwright `.spec.ts` kopyalarını temizler.
- Hedefli Builder E2E, unit suite, build ve tam E2E çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_BUILDER_OPTION_DISCOVERY_CLOSURE_v6.1D2.3.ps1
```
