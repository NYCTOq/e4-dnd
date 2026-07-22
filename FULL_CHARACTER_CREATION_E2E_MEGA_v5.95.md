# Full Character Creation E2E Mega v5.95

Bu paket sekiz tek-sınıf karakter yolculuğunu iki edition üzerinde denetler.

## Senaryolar
- 2024 Fighter, Wizard, Cleric, Warlock
- 2014 Bard, Monk, Paladin, Rogue

## Kapsam
- Builder adı, ruleset ve class seçimi
- Review ekranına ulaşma ve seçimin görünmesi
- Kaydedilmiş karakterin Characters listesi, Character Sheet, Play Mode ve Rest Center rotalarında açılması
- Mobil ve masaüstü Playwright projeleriyle uyumluluk
- Kararlı `data-testid` seçicileri

## Doğrulama
```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npx playwright install chromium
npm.cmd run verify:character-creation
```
