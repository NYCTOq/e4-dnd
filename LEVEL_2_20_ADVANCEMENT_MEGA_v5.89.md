# Level 2–20 Advancement Mega Pack v5.89

Bu paket Level Up Assistant akışını daha güvenli ve tamamlanabilir hale getirir.

## Eklenenler
- Hedef class için subclass açılma seviyesi kontrolü
- Level-up sırasında doğrudan subclass seçimi
- Seçilen subclass'ın `classLevels` kaydına yazılması
- Ana class subclass alanının güncellenmesi
- ASI/Feat kilometre taşı engeli
- Multiclass prerequisite engeli
- Class feature, spell progression, choice debt ve Epic Boon bildirimleri
- Tek bir Advancement Readiness özeti
- Eksikler tamamlanmadan Level Up butonunun kilitlenmesi

## Doğrulama
Paket hedefli Vitest senaryoları içerir. Çalışma ortamında bağımlılıklar bulunmadığından tam test ve build kullanıcı bilgisayarında çalıştırılmalıdır:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
```
