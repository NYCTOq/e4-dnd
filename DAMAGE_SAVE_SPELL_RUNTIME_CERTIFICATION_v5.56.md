# E4 D&D Damage & Save Spell Runtime Certification v5.56

## Kapsam

Bu paket 2014 ve 2024 için aşağıdaki savaş büyülerinin runtime davranışını kilitler:

- Sacred Flame
- Guiding Bolt
- Magic Missile
- Fireball
- Lightning Bolt
- Spirit Guardians

## Düzeltmeler

- Başarılı saving throw sonucunda yarım hasar artık spell level üzerinden tahmin edilmez. Yalnız büyünün açık kuralı veya `saveDamageRule` metadata'sı yarım hasar verirse uygulanır.
- Sacred Flame karakter seviyesi 5, 11 ve 17'de 2d8, 3d8 ve 4d8 olur; başarılı save sıfır hasar verir.
- Guiding Bolt her üst slot seviyesi için 1d6 artar ve sonraki saldırıya Advantage sağlayan rider rehberde görünür.
- Magic Missile slot seviyesi başına bir ek dart üretir. Dartlar ayrı ayrı 1d4+1 atılır ve farklı hedeflere dağıtılabilir.
- Fireball, Lightning Bolt ve Spirit Guardians başarılı save'de yarım hasar verir.
- 2014 ve 2024 Spirit Guardians tetikleme zamanları edition bazlı rehberlenir.
- Play Mode saving throw hasar seçimi varsayılan olarak `Büyü kuralı` moduna alınmıştır. Kullanıcı gerektiğinde manuel yarım/sıfır seçebilir.

## Test sonucu

- 169 test dosyası geçti.
- 702 test geçti.
- 0 başarısız test.
- TypeScript ve Vite production build başarılı.
- PWA generateSW başarılı, 85 precache girdisi üretildi.

## Bilinen bağımsız uyarı

`src/App.css` içindeki geç konumlandırılmış `@import` PostCSS uyarısı devam eder. Build'i engellemez ve bu paketin kapsamı dışındadır.
