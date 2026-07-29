# E4 D&D v6.1D3.5 Builder Class Selection Flake Closure

D3.4 hedefli testleri geçti ancak tam E2E koşusunda dört class seçimi aralıklı olarak başarısız oldu.

Kök neden:

- İstenen class seçeneği bir `<option>` içinde bulunuyordu.
- Özel Builder arayüzü bağlı `<select>` öğesini bazı render anlarında görünmez tutuyordu.
- Helper görünürlük şartı yüzünden select'i atlıyor, sonra fallback ile aynı görünmez `<option>` öğesine tıklamaya çalışıyordu.

Bu paket:

- Option'ı içeren select üzerinde `selectOption(value, { force: true })` kullanır.
- Fallback aramasından `<option>` öğelerini tamamen çıkarır.
- Fallback'i yalnızca görünür ve tam eşleşen gerçek kontrol öğeleriyle sınırlar.
- Hedefli karakter E2E dosyasını üç kez tekrarlar.
- Unit suite, production build ve tam E2E paketini çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_BUILDER_CLASS_SELECTION_FLAKE_CLOSURE_v6.1D3.5.ps1
```
