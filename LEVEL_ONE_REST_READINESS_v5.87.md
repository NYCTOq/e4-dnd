# Level One Rest, Recovery & Hit Dice Readiness v5.87

Bu paket Builder Review ekranına dinlenme ve kaynak yenilenme bütünlük denetimi ekler.

## Denetimler

- Class Hit Die türü ve toplam Hit Dice kapasitesi
- Kullanılmış Hit Dice sınırları
- Normal spell slot kullanım sınırları
- Pact Magic slot kullanım sınırları ve Warlock kaynağı
- Short Rest, Long Rest ve manuel recovery kaynakları
- Kısmi Short Rest yenilenme miktarı
- Yinelenen resource, spell slot ve Hit Die kayıtları
- Exhaustion ve manuel kaynak bildirimleri

## Sürüm

`5.87.0`

## Doğrulama

Paket dört hedefli Vitest senaryosu içerir. Çalışma ortamında `node_modules` bulunmadığından test ve production build yeniden çalıştırılamadı.

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
```
