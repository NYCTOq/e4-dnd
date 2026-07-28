# E4 D&D v5.142D2 Entry Chunk Split Hotfix

The legacy forced shell chunk was removed in v5.142, but eager application infrastructure moved into the entry bundle and exceeded the 200 KiB budget.

This hotfix keeps route pages lazy and extracts only eagerly shared infrastructure into stable chunks:

- `app-core`
- `app-shared`
- `app-homebrew-core`
- `app-campaign-core`
- `app-backup-core`

It does not raise the budget. The existing v5.142 tests, production build, and bundle audit remain authoritative.
