# M-MEGA1 Staging Rollback Rehearsal

Bu prova production yerine staging veya geçici alt domainde yapılmalıdır.

1. Mevcut staging dosyalarını yedekle.
2. `E4_DND_6.2.0_APACHE_UPLOAD.zip` veya Nginx paketini yükle.
3. Bir test karakteri oluştur.
4. Sayfayı yenile ve kaydın kaldığını doğrula.
5. Önceki deployment dosyalarını geri yükle.
6. localStorage kaydının silinmediğini doğrula.
7. Tekrar 6.2.0 deployment'a dön.
8. Test karakterinin tekrar açıldığını doğrula.
9. Manifest, service worker ve deep route testlerini tekrar yap.
10. Sonucu launch evidence notlarına kaydet.
