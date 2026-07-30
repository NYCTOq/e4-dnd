# E4 D&D M-MEGA1d GitHub Release Not-Found Repair

GitHub CLI authentication succeeded, but the release publishing script stopped when:

```text
release not found
```

That result is expected when the `v6.2.0` tag exists but a GitHub Release has not been created yet.

PowerShell treated the GitHub CLI stderr output as a terminating error before the script could enter its create-release branch.

This repair:

- temporarily makes the release existence probe non-fatal
- creates the release when it does not exist
- updates assets when it already exists
- verifies GitHub CLI authentication
- publishes the `v6.2.0` release and assets

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_GITHUB_RELEASE_NOT_FOUND_REPAIR_M_MEGA1D.ps1
```
