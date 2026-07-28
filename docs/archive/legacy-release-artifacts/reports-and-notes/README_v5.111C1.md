# v5.111C1 Rest Recovery Type Export Hotfix

## Kök neden

`restRecoveryCharacterAdapter.ts` şu type'ı import ediyordu:

```ts
RestRecoveryState
```

Runtime modülünde aynı veri yapısı yalnızca şu adla export edilmişti:

```ts
RestState
```

Tüm testler başarılıydı fakat TypeScript production build isim uyuşmazlığı
nedeniyle durdu.

## Düzeltme

Runtime modülüne geriye dönük uyumlu alias eklenir:

```ts
export type RestRecoveryState = RestState;
```

Runtime davranışı değişmez.

## Çalıştırılanlar

- TypeScript + Vite production build
- PWA generation
- Runtime certification report
- Golden integration report

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Çalıştır:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_RECOVERY_TYPE_EXPORT_HOTFIX_v5.111C1.ps1
```
