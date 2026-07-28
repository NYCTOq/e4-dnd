# v5.105B Automated Certification Matrix

Önce v5.105A kurulmalıdır.

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CERTIFICATION_MATRIX_v5.105B.ps1
```

Komutlar:

```powershell
npm.cmd run certify:catalog
npm.cmd run certify:builder
npm.cmd run certify:quick
npm.cmd run certify:release
```

İlk sürüm deterministic pairwise senaryo üretici, 30+ kombinasyon, üç golden Builder E2E testi ve JSON/Markdown rapor iskeleti ekler.
