# Combat Status, Concentration & Death Saves Certification v5.69

Bu paket Play Mode savaş durum zincirini tamamlar.

## Kapsam

- Süreli condition değerleri tur sonunda bir azalır ve sıfırda otomatik temizlenir.
- Süresiz condition kayıtları korunur.
- Concentration save yalnız aktif concentration etkisi varken ve pozitif hasar alındığında istenir.
- Concentration DC mevcut `max(10, damage / 2)` kuralını kullanır.
- Death save durumu Ayakta, Ölüm Save'i Gerekli, Stabil ve Ölü olarak sınıflandırılır.
- Üç başarıdan sonra yeni death save atılması engellenir.
- Üç başarısızlıktan sonra death save düğmesi kapanır.
- Natural 20, Natural 1, sıfır HP'de hasar ve iyileşme davranışları mevcut survival motoruyla korunur.

## Sürüm

`5.69.0`
