# v5.108 Ability, Proficiency & Derived Stats Mega

## Kurulum

ZIP içeriğini proje köküne çıkarın:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ABILITY_PROFICIENCY_DERIVED_STATS_v5.108.ps1
```

## E2E

```powershell
npm.cmd run certify:ability:e2e
```

## Tam zincir

```powershell
npm.cmd run certify:ability:release
```

## Kapsam

- 26 ability modifier vakası
- 20 level proficiency progression
- 18 skill eşlemesi
- point buy ve standard array
- save, skill, expertise, initiative
- passive perception ve spell save DC
- AC oracle
- 240 deterministic derived-stat senaryosu
- desktop/mobile ability step smoke testleri
