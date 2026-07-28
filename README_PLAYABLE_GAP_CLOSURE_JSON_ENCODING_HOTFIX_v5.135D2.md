# E4 D&D v5.135D2 — package.json UTF-8 Encoding Hotfix

## Root cause
The v5.135D1 PowerShell script updated `package.json` with Windows PowerShell's default text encoding. This can rewrite JSON as UTF-16. npm may still tolerate the file, while Vite/Rolldown fails immediately with:

`[JSON_PARSE] expected value at line 1 column 1`

## Fix
- Detects UTF-16 LE, UTF-16 BE, UTF-8 BOM, or normal UTF-8.
- Parses the existing package JSON.
- Sets version to `5.135.2`.
- Rewrites `package.json` as UTF-8 without BOM using .NET.
- Verifies JSON parsing and encoding.
- Runs `certify:playable-gap-closure`.
