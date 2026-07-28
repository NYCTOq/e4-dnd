# v5.88 Final Readiness Build Hotfix

`ReadinessStatusLike.applicable` artık opsiyoneldir. Alan yoksa bölüm uygulanabilir kabul edilir.

Bu düzeltme `SingleClassPlayableReadiness` ve `LevelOneCombatReadiness` tiplerinin final readiness gate içine doğrudan aktarılmasını sağlar.

Kurulumdan sonra:

```powershell
npm.cmd test
npm.cmd run build
```
