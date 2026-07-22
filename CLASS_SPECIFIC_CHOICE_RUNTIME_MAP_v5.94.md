# Class-Specific Choice & Runtime Map v5.94

Bu paket 12 ana class için Builder seçimi, Character Sheet görünürlüğü, Play Mode davranışı ve Rest recovery beklentilerini tek politika tablosunda birleştirir.

## Kapsam

- Barbarian: Rage, Reckless Attack, Primal Knowledge
- Bard: Bardic Inspiration, Expertise, Magical Secrets
- Cleric: Divine Order, Channel Divinity, Divine Intervention
- Druid: Primal Order, Wild Shape, Wild Resurgence
- Fighter: Fighting Style, Weapon Mastery, Maneuvers, Second Wind, Action Surge
- Monk: Focus/Ki, Martial Arts, Flurry of Blows, Stunning Strike
- Paladin: Fighting Style, Oath, Lay on Hands, Divine Smite
- Ranger: Fighting Style, Weapon Mastery, Favored Enemy/Hunter's Mark
- Rogue: Expertise, Sneak Attack, Cunning Action, Cunning Strike
- Sorcerer: Sorcery Points, Font of Magic, Metamagic
- Warlock: Pact Boon, Invocations, Pact Magic, Mystic Arcanum
- Wizard: Spellbook, Prepared Spells, Arcane Recovery

Ruleset Center her class için Builder, Sheet, Play ve Rest alanlarını ayrı ayrı complete/partial/missing olarak gösterir.

## Doğrulama

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npx playwright install chromium
npm.cmd run test:e2e:class-runtime
```

Tek komut:

```powershell
npm.cmd run verify:class-runtime
```
