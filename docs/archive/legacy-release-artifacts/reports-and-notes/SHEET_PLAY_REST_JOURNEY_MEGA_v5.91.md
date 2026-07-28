# Sheet + Play Mode + Rest Journey Integration Mega v5.91

Bu paket Character Sheet, Play Mode ve Rest Center ekranlarının aynı ortak yolculuk snapshot'ını kullanmasını sağlar.

## Kapsam
- Eksik HP, harcanmış normal/Pact slotları, kaynaklar ve Hit Dice ortak hesaplanır.
- Short Rest / Long Rest önerisi tek motordan gelir.
- Character Sheet ve Play Mode arasında doğrudan geçişler bulunur.
- Rest Center her karakter için beklenen dinlenme türünü gösterir.
- Ortak motor için üç unit test ve bir Playwright yolculuk testi eklenmiştir.

## Doğrulama
```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e:journey
```
