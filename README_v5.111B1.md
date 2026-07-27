# v5.111B1 Rest Recovery Differential Canonicalization Hotfix

## Kök neden

Runtime normal spell slotlarda optional alanı açıkça yazıyordu:

```ts
pact: false
```

Bağımsız oracle ise aynı alanı hiç yazmıyordu:

```ts
// pact alanı yok
```

Davranış aynı olmasına rağmen deep equality obje şekillerini farklı saydığı için
153 test aynı nedenle kırmızıya düştü.

## Düzeltme

Differential karşılaştırmadan önce sonuçları kanonikleştirir:

- `pact: false` alanları kaldırılır.
- `pact: true` korunur.
- Array ve nested object yapıları recursive normalize edilir.
- Gerçek HP, slot, resource, rest veya effect farkları gizlenmez.

## Çalıştırılanlar

- Differential testleri
- Scenario matrix
- Production build
- Runtime certification report

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Çalıştır:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_RECOVERY_DIFFERENTIAL_CANONICALIZATION_HOTFIX_v5.111B1.ps1
```
