# E4 D&D v6.1 – Thirty Golden Character Certification

This package installs a deterministic 30-character certification layer over the current repository.

It runs:

1. Independent D&D progression oracle tests.
2. The repository's complete Vitest suite.
3. TypeScript and Vite production build.
4. The repository's complete Playwright E2E suite.
5. Source coverage checks for all 30 ancestry/class/subclass combinations.
6. Markdown, JSON and CSV reports designed for follow-up diagnosis.

The oracle verifies edition-aware subclass unlock levels, proficiency bonus, Fighter/Rogue extra ASI progression and full/half/third/pact spellcasting classification. It does not falsely claim that unspecified ability scores, equipment and player choices have one unique correct AC or HP value.

## Apply

Extract the folder contents into the project root, then run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.ps1
```

Send these files after the run:

- `reports/THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.md`
- `reports/THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.json`
- The terminal output if PowerShell stops before report generation.
