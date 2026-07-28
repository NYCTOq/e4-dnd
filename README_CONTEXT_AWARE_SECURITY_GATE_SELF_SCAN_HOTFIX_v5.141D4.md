# E4 D&D v5.141D4

Fixes the v5.141D3 false positive where the security scanner detected RSC marker strings inside its own audit script.

Changes:
- scans only `src/**`, Vite/Vitest config files and `package.json`;
- excludes `scripts`, reports, docs, dependencies and build output;
- treats `react-router-dom` as part of the same accepted router advisory chain when the underlying `react-router` finding is only GHSA-qwww-vcr4-c8h2;
- keeps every unrelated production high/critical vulnerability blocking;
- runs critical tests and production build after the gate passes.
