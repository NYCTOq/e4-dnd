# Everything for D&D

E4 D&D; karakter, büyü, envanter, canavar, homebrew, campaign, encounter, Play Mode ve yedekleme araçlarını tek bir PWA içinde toplayan React + TypeScript uygulamasıdır.

## Yerel geliştirme

```powershell
cd D:\Projects\e4_dnd
npm.cmd install
npm.cmd run dev -- --port 5173
```

Geliştirme sırasında `5173` portunu korumak önemlidir. Tarayıcı localStorage verilerini origin bazında tuttuğu için port değişirse kayıtlar başka bir ortamdaymış gibi görünür.

## Kalite kontrolleri

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Üç kontrolü tek komutla çalıştırmak için:

```powershell
npm.cmd run check
```

## GitHub Actions

`.github/workflows/ci.yml` aşağıdaki durumlarda otomatik çalışır:

- `main` branch'ine push
- `main` branch'ine açılan pull request
- GitHub Actions ekranından manuel çalıştırma

Pipeline sırasıyla bağımlılıkları kurar, kaynak dosyaları lint eder, testleri çalıştırır ve production build alır. Başarılı build, GitHub Actions çalışmasına 14 gün saklanan `dist` artifact'ı olarak eklenir.

## Ana komutlar

| Komut | İşlev |
| --- | --- |
| `npm.cmd run dev -- --port 5173` | Geliştirme sunucusu |
| `npm.cmd run lint` | Yalnızca `src` klasörünü lint eder |
| `npm.cmd test` | Vitest testlerini bir kez çalıştırır |
| `npm.cmd run test:watch` | Testleri izleme modunda çalıştırır |
| `npm.cmd run build` | TypeScript kontrolü ve production build |
| `npm.cmd run check` | Lint + test + build |

## GitHub Pages Otomatik Dağıtım

CI başarılı olduğunda `main` branch otomatik olarak GitHub Pages'e yayınlanır. İlk kurulum ve ayrıntılar için `DEPLOYMENT.md` dosyasına bakın.
