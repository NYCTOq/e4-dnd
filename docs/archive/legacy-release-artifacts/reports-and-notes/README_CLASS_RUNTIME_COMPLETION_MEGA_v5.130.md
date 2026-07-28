# E4 D&D v5.130 — Class Runtime Completion Mega

## Gerçek kullanıcı özellikleri
- Sınıf özelliği panelinden kısa dinlenme yenilemesi.
- Sınıf özelliği panelinden uzun dinlenme yenilemesi.
- Short-rest kaynaklarının long rest sırasında da doğru yenilenmesi.
- Multiclass karakterlerde tüm class feature kaynaklarının birlikte toparlanması.
- Harcama ve dinlenme sonrası erişilebilir canlı geri bildirim.
- Mobil için en az 44 px dinlenme kontrol hedefleri.

## Korunan davranışlar
- Kilitli seviye özellikleri runtime panelinde açılmaz.
- Kullanımlar sıfırın altına düşmez.
- Manuel recovery özellikleri otomatik yenilenmez.
- Mevcut tekil “Harca / Yenile” kontrolleri korunur.

## Çalıştırma
```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CLASS_RUNTIME_COMPLETION_MEGA_v5.130.ps1
```
