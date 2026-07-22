# Level One Identity, Social & Roleplay Readiness v5.84

Bu paket Builder Review ekranına kimlik ve sosyal profil denetimi ekler.

## Kapsam

- Karakter adı, Class, Race/Species ve Background katalog bütünlüğü
- Sosyal skill özeti: Deception, Insight, Intimidation, Performance, Persuasion
- Language sayısı ve sosyal büyülerin özeti
- Katalog dışı spell referanslarının engellenmesi
- Oyuncu adı eksikliği için bilgilendirme
- Kişilik, amaç veya bağ notu eksikliği için rol yapma bildirimi
- Sosyal seçeneği olmayan karakter için engel oluşturmayan oynanış uyarısı

## Tasarım kararı

Oyuncu adı ve karakter notları resmî mekanik zorunluluk değildir. Bu nedenle karakter kaydını engellemez; yalnız Review ekranında notice üretir. Karakter adı ve temel katalog seçimleri ise karakter kimliğinin güvenli kaydı için blocker olarak değerlendirilir.

## Doğrulama

Paket dört hedefli Vitest senaryosu içerir. Bu çalışma ortamında bağımlılıklar bulunmadığı için test ve production build yerel olarak yeniden çalıştırılmalıdır:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
```
