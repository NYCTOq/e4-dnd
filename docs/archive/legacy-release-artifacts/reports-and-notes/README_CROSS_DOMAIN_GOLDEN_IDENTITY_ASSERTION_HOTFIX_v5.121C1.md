# E4 D&D v5.121C1 - Golden Identity Assertion Hotfix

This hotfix corrects the golden lifecycle identity snapshot used by v5.121C.

The original assertion treated `classes[].classLevel` as immutable identity even
after a valid level-up. That caused every golden profile to fail after progression,
although the runtime correctly increased the selected class level.

The repaired snapshot preserves stable class structure (`classId` and `hitDie`)
while level progression remains certified by the dedicated level-up assertion.

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CROSS_DOMAIN_GOLDEN_IDENTITY_ASSERTION_HOTFIX_v5.121C1.ps1
```
