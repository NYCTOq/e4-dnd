# v5.123B2 Search Alias Matrix Count Hotfix

Repairs the final v5.123B assertion by deriving the alias-check total from the generated route matrix instead of enforcing a stale literal count. Alias failures remain blockers; ambiguity remains explicitly reported.
