# GitHub Pages Deployment

Bu proje `main` branch'ine yapılan her push'ta GitHub Actions üzerinden kontrol edilir.

Pipeline sırası:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. GitHub Pages SPA fallback (`dist/404.html`)
6. GitHub Pages deployment

Pull request çalışmalarında yalnızca kalite kontrolleri çalışır; canlı dağıtım yapılmaz.

## İlk Kurulum

GitHub repository içinde:

1. **Settings** sayfasını açın.
2. Sol menüden **Pages** bölümüne girin.
3. **Build and deployment > Source** alanını **GitHub Actions** olarak seçin.
4. `main` branch'ine push yapın.

Canlı adres:

`https://nyctoq.github.io/e4-dnd/`

## Yerel Kontrol

```powershell
npm.cmd run check
```

## Önemli Yapı

- GitHub Actions build değişkeni: `VITE_BASE_PATH=/e4-dnd/`
- Yerel geliştirme base yolu: `/`
- React Router basename: `import.meta.env.BASE_URL`
- PWA start URL ve scope: `/e4-dnd/`
- `404.html`, GitHub Pages üzerinde route yenilemelerinin çalışmasını sağlar.
