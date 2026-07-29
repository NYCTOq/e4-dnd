# E4 D&D v6.1D3.5a Builder Helper Syntax Repair

D3.5 patcherinin oluşturduğu Builder helper bloğunda iç içe template literal kullanımı TypeScript parse hatası üretti.

Hata:

```text
Invalid left-hand side in assignment expression
```

Bu hotfix:

- `__e4OpenBuilderStep` ve `__e4ChooseOptionFromBuilderPanel` fonksiyonlarını tamamen yeniden yazar.
- Selector oluştururken template literal kullanmaz.
- Class select kontrolünü `selectOption(..., { force: true })` ile çalıştırır.
- Görünmez `<option>` öğelerini fallback seçiminden çıkarır.
- Önce `playwright --list` ile parse/collection kapısı çalıştırır.
- Karakter yolculuğunu üç kez tekrarlar.
- Unit suite, build ve tam E2E çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_BUILDER_HELPER_SYNTAX_REPAIR_v6.1D3.5a.ps1
```
