# E4 D&D v5.142D1 Bundle Performance Test Type Hotfix

Bu hotfix `bundlePerformanceBudget-v5.142.test.ts` içindeki iki `Array.some` callback parametresini açıkça `string` olarak tipler.

Düzeltme yalnız test tipini değiştirir. Bundle optimizasyonu ve bütçe kuralları korunur.

## Uygulama

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_BUNDLE_PERFORMANCE_TEST_TYPE_HOTFIX_v5.142D1.ps1
```

Beklenen sonuç:

```text
4 tests passed
build passed
Bundle budget: PASS
v5.142D1 GREEN - Performance & Bundle Optimization closed; next target: UX Polish & Onboarding v5.143.
```
