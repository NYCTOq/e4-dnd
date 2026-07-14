# E4 D&D Releases

## 1.8.0

Locations + World Atlas, mekân hiyerarşisi ve NPC bağlantıları.


## Uygulama sürümünü yükseltme

`package.json` ve `package-lock.json` içindeki sürüm numarası birlikte güncellenir.

Örnek:

```powershell
npm.cmd version patch --no-git-tag-version
npm.cmd run check
git add .
git commit -m "release: prepare v1.0.1"
git push
```

## GitHub Release oluşturma

Hazırlık commit'i `main` branch'ine gönderildikten sonra tag oluşturulur:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

`Release` workflow'u otomatik olarak:

1. Bağımlılıkları kurar.
2. Lint, test ve production build çalıştırır.
3. `dist` klasörünü zipler.
4. GitHub Releases bölümünde otomatik sürüm kaydı oluşturur.
5. Production zip dosyasını release'e ekler.

## Uygulama içi sürüm notları

Yeni sürüm için `src/shared/release/releaseNotes.ts` dosyasına en üste yeni kayıt eklenir. Kullanıcı yeni sürümü ilk açtığında notlar bir defa otomatik gösterilir.
