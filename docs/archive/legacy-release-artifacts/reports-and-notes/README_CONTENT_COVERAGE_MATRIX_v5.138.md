# E4 D&D v5.138 Content Coverage Matrix

ZIP içindeki `e4_patch_5138` klasörünün içeriğini proje köküne çıkarın.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CONTENT_COVERAGE_MATRIX_v5.138.ps1
```

Üretilen raporlar:

- `reports/CONTENT_COVERAGE_MATRIX_v5.138.md`
- `reports/CONTENT_COVERAGE_MATRIX_v5.138.csv`
- `reports/CONTENT_COVERAGE_MATRIX_v5.138.json`

Matris class, subclass, spell, feat ve item içeriklerini veri/runtime/UI/test katmanlarıyla sınıflandırır. `automatic`, `partial` ve `manual` çalışma biçimleri ayrı gösterilir. Bu statik ve yapısal bir denetimdir; her masaüstü kuralının semantik olarak otomatikleştirildiği iddiasında bulunmaz.
