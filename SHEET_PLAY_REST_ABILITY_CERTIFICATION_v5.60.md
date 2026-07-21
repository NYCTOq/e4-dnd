# E4 D&D v5.60 — Character Sheet, Play Mode, Rest & Ability Controls

## Kapsam

- Builder rolled Ability Score alanları klavye girişi yerine erişilebilir `− / +` butonları kullanır.
- Character Editor içindeki altı Ability Score klavye girişi yerine aynı ortak stepper bileşenini kullanır.
- Ability değerleri Builder'da 3–20, Character Editor'da 1–20 sınırları içinde tutulur.
- Mobil dokunmatik hedefler en az 48 px, masaüstü hedefler en az 44 px'tir.
- Warlock Pact Magic slotları Short Rest ve Long Rest sırasında yenilenir.
- Short-rest kaynakları aynı dinlenmede sıfırlanır veya tanımlı miktarda geri kazanılır.
- Long Rest normal spell slotlarını yeniler, aktif spell effect'lerini temizler, varsayılan ayarlarda HP'yi doldurur ve exhaustion'ı bir azaltır.
- Rest sonrasındaki kaynak ve slot sonuçları Character Sheet / Play Mode ortak snapshot'ında aynı görünür.
- App.css içindeki geç @import kaldırıldı; production build artık PostCSS import sırası uyarısı üretmez.

## Otomatik test sonucu

- 174 test dosyası geçti.
- 727 test geçti.
- 0 test başarısız oldu.
- TypeScript ve Vite production build başarılı.
- PWA generateSW başarılı, 85 precache girdisi üretildi.
