# RC1 Release Checklist

## Blocker gates

- [ ] `npm.cmd run audit:rc`
- [ ] `npm.cmd run audit:technical-debt`
- [ ] `npm.cmd run lint`
- [ ] Critical unit suite green
- [ ] Production build green
- [ ] RC1 critical route E2E green
- [ ] No uncaught browser errors
- [ ] package.json, package-lock and manifest versions match

## Manual smoke

- [ ] Create a level 1 character
- [ ] Advance a character at least one level
- [ ] Open combat and start a new encounter
- [ ] Open character inventory and economy panel
- [ ] Export and inspect a backup
- [ ] Open settings accessibility panel
- [ ] Check one desktop and one mobile viewport

RC1 cannot be promoted while any blocker remains.
