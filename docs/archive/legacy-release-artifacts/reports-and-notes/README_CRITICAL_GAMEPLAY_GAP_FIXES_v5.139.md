# E4 D&D v5.139 — Critical Gameplay Gap Fixes

Play Mode içindeki sessiz başarısızlıkları merkezi gameplay guard kurallarına bağlar.

## Eklenenler
- Action, Bonus Action ve Reaction çakışmalarında görünür neden
- Yetersiz class/subclass kaynağında görünür neden
- Uygun spell slotu kalmadığında görünür neden
- Aktif item etkisi saldırgan büyüyü engelliyorsa görünür neden
- Casting time → action economy normalizasyonu
- Concentration save DC için ortak resmi `max(10, floor(damage / 2))` hesabı
- 5 hedefli test ve production build kapısı

## Kurulum
ZIP içeriğini proje köküne çıkarın ve çalıştırın:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CRITICAL_GAMEPLAY_GAP_FIXES_v5.139.ps1
```
