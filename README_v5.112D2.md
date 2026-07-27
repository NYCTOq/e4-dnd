# v5.112D2 Class Feature Panel & Persistence Bridge Mega

## Eklenenler

- Class Feature Panel React bileşeni
- Action / Bonus Action / Reaction / Passive / Special grupları
- Açılmış özelliklerin gösterimi
- Current / maximum uses
- Harca ve Yenile işlemleri
- Karakter storage persistence bridge
- Array ve wrapped collection desteği
- Legacy ve malformed payload güvenliği
- Multiclass uyumluluğu
- Homebrew alan koruması
- Usage persistence matrix
- Build ve PWA

## Test ID yapısı

```text
class-feature-panel
class-feature-empty
class-feature-<id>
class-feature-uses-<id>
class-feature-spend-<id>
class-feature-restore-<id>
```

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CLASS_FEATURE_PANEL_PERSISTENCE_BRIDGE_MEGA_v5.112D2.ps1
```

## Sonraki paket

v5.112D3, paneli gerçek Character Detail ve Play Mode yollarına bağlayacak,
desktop/mobile E2E ve final closure audit çalıştıracaktır.
