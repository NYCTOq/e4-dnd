# E4 D&D v5.132 — Spell Runtime Completion Mega

## Gerçek oynanış değişiklikleri

- Tek işlemde slot uygunluğu doğrulama, slot harcama ve büyü çözümleme.
- Concentration büyüsü atıldığında önceki concentration durumunun güvenli değiştirilmesi.
- Damage, healing, save sonucu, upcast ve cantrip scaling için ortak runtime sonucu.
- Süreli spell effect'lerinin round azaltımı ve süresi bitenlerin temizlenmesi.
- Short rest ile Pact slotlarının, long rest ile tüm spell slotlarının yenilenmesi.
- Büyü panelinde short/long rest düğmeleri.
- Hasar sonrası concentration DC ve Constitution save kontrolü.
- Kullanıcıya aria-live spell runtime bildirimi.
- Mobilde 44px minimum kontrol yüksekliği.

## Kurulum

ZIP içindeki klasörün içeriğini proje köküne çıkarın ve çalıştırın:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_RUNTIME_COMPLETION_MEGA_v5.132.ps1
```

## Beklenen sonuç

```text
v5.132 GREEN - Spell Runtime Completion closed; next target: Feat & Item Runtime Mega v5.133.
```
