# v5.110E1 Final Report Discovery Hotfix

## Kök neden

Final audit iki raporun dosya adını sabit olarak bekliyordu:

```text
equipment-combat-certification.json
equipment-combat-differential.json
```

Rapor üreticileri başarılı çalışmasına rağmen gerçek dosya adları farklı olduğu
için audit yanlış biçimde `RED` sonucuna düştü.

## Düzeltme

Audit artık:

- `certification-reports` klasörünü tarar.
- Base equipment/combat raporunu dosya adı veya içerikten bulur.
- Differential raporu dosya adı veya içerikten bulur.
- Bulduğu gerçek dosya adlarını final rapora yazar.
- Golden ve E2E raporlarını sabit, doğrulanmış adlarıyla kontrol etmeye devam eder.

## Neden tüm testler yeniden çalışmıyor?

Önceki final koşusunda:

- 569 core test geçti.
- 4 E2E test geçti.
- Build ve PWA üretimi başarılı oldu.
- Rapor üretim komutları başarılı oldu.

Bu hotfix yalnızca hatalı audit katmanını yeniden çalıştırır.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_FINAL_REPORT_DISCOVERY_HOTFIX_v5.110E1.ps1
```
