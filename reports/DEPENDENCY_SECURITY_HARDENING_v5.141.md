# Dependency & Security Hardening v5.141

Generated: 2026-07-28T11:28:03.267Z
Package version: 5.141.0

## Audit summary

| Scope | Low | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|---:|
| All dependencies | 0 | 0 | 10 | 0 | 10 |
| Production only | 0 | 0 | 2 | 0 | 2 |

## Policy

- `npm audit fix --force` was not used.
- Automatic major-version upgrades were not used.
- Existing semver ranges may be refreshed only by the apply script through `npm update`.
- Production high/critical vulnerabilities fail the security gate.

## Direct high/critical dependencies

- **react-router-dom**: high; range `>=7.12.0-pre.0`; fix: `{"name":"react-router-dom","version":"7.11.0","isSemVerMajor":true}`
- **vite-plugin-pwa**: high; range `>=1.3.0`; fix: `{"name":"vite-plugin-pwa","version":"1.2.0","isSemVerMajor":true}`

## Detailed vulnerability paths

| Package | Severity | Direct | Range | Fix available |
|---|---|---:|---|---|
| @trickfilm400/rollup-plugin-off-main-thread | high | no | <=3.1.0-pre2 | breaking/explicit |
| brace-expansion | high | no | <=5.0.7 | breaking/explicit |
| ejs | high | no | 3.1.2 - 4.0.1 | breaking/explicit |
| filelist | high | no | 0.0.5 - 1.0.6 | breaking/explicit |
| jake | high | no | 10.6.1 - 10.9.4 | breaking/explicit |
| minimatch | high | no | 2.0.0 - 10.0.2 | breaking/explicit |
| react-router | high | no | 7.12.0 - 8.2.0 | breaking/explicit |
| react-router-dom | high | yes | >=7.12.0-pre.0 | breaking/explicit |
| vite-plugin-pwa | high | yes | >=1.3.0 | breaking/explicit |
| workbox-build | high | no | >=7.4.1 | breaking/explicit |

## Gate result

**BLOCKED:** production dependency tree contains 2 high and 0 critical vulnerabilities.

Detailed machine-readable data is in `reports/DEPENDENCY_SECURITY_HARDENING_v5.141.json`.
