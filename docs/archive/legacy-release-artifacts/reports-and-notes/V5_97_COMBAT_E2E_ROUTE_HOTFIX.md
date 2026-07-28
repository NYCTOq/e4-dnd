# v5.97 Combat E2E Route Hotfix

Playwright testi yanlışlıkla `/combat-tracker` rotasına gidiyordu.

Gerçek uygulama rotası:

```text
/combat
```

Bu hotfix yalnız `e2e/combat-runtime-automation.spec.ts` dosyasındaki rotayı düzeltir.

Doğrulama:

```powershell
npm.cmd run test:e2e:combat-runtime
```
