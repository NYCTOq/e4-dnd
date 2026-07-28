# E4 D&D v5.121A1 - Release Notes Syntax Hotfix

This hotfix repairs the malformed `RELEASE_NOTES` array declaration introduced by v5.121A.
The malformed declaration caused TypeScript to report hundreds of cascading syntax errors from
`src/shared/release/releaseNotes.ts`.

Extract into `D:\Projects\e4_dnd`, allow overwrite, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CROSS_DOMAIN_RELEASE_NOTES_SYNTAX_HOTFIX_v5.121A1.ps1
```
