# E4 D&D CI Rehberi

## Otomatik kontrol akışı

GitHub Actions, `main` branch'ine gönderilen her değişiklikte ve pull request'te şu kontrolleri yapar:

1. Node.js 22 ortamını kurar.
2. `npm ci` ile kilit dosyasındaki bağımlılıkları yükler.
3. `npm run lint` ile yalnızca uygulama kaynaklarını kontrol eder.
4. `npm test` ile Vitest testlerini çalıştırır.
5. `npm run build` ile production çıktısını üretir.
6. Başarılı `dist` klasörünü indirilebilir artifact olarak saklar.

## GitHub'da sonucu görme

Repository içinde **Actions** sekmesine girip son `CI` çalışmasını açın. Yeşil işaret bütün kontrollerin geçtiğini, kırmızı işaret aşamalardan birinin hata verdiğini gösterir.

## Build artifact indirme

Başarılı CI çalışmasının altındaki **Artifacts** bölümünde `e4-dnd-dist-<commit>` adlı paket bulunur. Bu paket 14 gün saklanır ve production `dist` klasörünü içerir.

## Yerelde aynı kontrol

GitHub'a göndermeden önce aynı kontrolleri çalıştırmak için:

```powershell
npm.cmd run check
```

Bu komut başarısızsa push atmadan önce gösterilen ilk kaynak hatasını düzeltmek en temiz akıştır. `node_modules` içindeki üçüncü taraf kodlar lint kapsamına alınmaz.
