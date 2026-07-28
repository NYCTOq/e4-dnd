# E4 D&D Save, Import & Migration Certification v5.62

## Kapsam

Bu paket karakter yedekleme, karakter içe aktarma, tam yedek sürümleme, eski format migration ve bozuk veri reddi akışlarını güçlendirir.

## Değişiklikler

- Karakter dışa aktarımları sürümlü `e4-dnd-character-backup` zarfı kullanır.
- Eski ham karakter dizisi JSON dosyaları geriye dönük olarak desteklenir.
- İçe aktarılan her karakter hydrate edilerek güncel varsayılan alanlara taşınır.
- Eksik veya geçersiz ability blokları, kimlik, sınıf, level, HP ve AC kayıtları reddedilir.
- Aynı ID'ye sahip yinelenen karakter kayıtları içe aktarma öncesinde reddedilir.
- Gelecekteki daha yeni backup sürümleri güvenli biçimde reddedilir.
- Tam yedek formatı V3'e yükseltilmiştir ve uygulama sürümünü kaydeder.
- Tam yedeklerde geçersiz sürüm bilgisi ve yinelenen karakter ID'leri denetlenir.
- Geçersiz export tarihi güvenli bir güncel tarih ile normalize edilir.

## Uyumluluk

- Character backup V2: Güncel format
- Character backup V1: Desteklenir ve migrate edilir
- Legacy raw character array: Desteklenir ve migrate edilir
- Full backup V1/V2: Desteklenir
- Full backup V3: Güncel format
- Daha yeni sürümler: Veri kaybını önlemek için reddedilir

## Doğrulama

- 176 test dosyası geçti.
- 740 test geçti.
- TypeScript build başarılı.
- Vite production build başarılı.
- PWA generateSW başarılı, 85 precache girdisi.
