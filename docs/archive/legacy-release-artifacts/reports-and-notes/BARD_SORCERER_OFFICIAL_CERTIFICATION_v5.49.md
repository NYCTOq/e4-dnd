# Bard + Sorcerer Official Certification v5.49

## Scope
- D&D 2014 Bard: 9 ancestries × 8 supported official colleges × 20 levels = 1,440 scenarios
- D&D 2024 Bard: 10 species × 4 PHB colleges × 20 levels = 800 scenarios
- D&D 2014 Sorcerer: 9 ancestries × 8 supported official origins × 20 levels = 1,440 scenarios
- D&D 2024 Sorcerer: 10 species × 4 PHB subclasses × 20 levels = 800 scenarios
- Total: 4,480 ancestry × subclass × level scenarios

## Added Bard subclasses
### 2014
- College of Creation
- College of Eloquence
- College of Glamour
- College of Spirits
- College of Swords
- College of Whispers

Existing College of Lore and College of Valor remain available.

### 2024
- College of Glamour

The 2024 Bard catalog now contains College of Dance, College of Glamour, College of Lore, and College of Valor.

## Independent progression assertions
The new `bardSorcererOfficialProgression.test.ts` locks:
- Bard 2014 and 2024 class feature checkpoints
- Bard known/prepared spell tables
- Bardic Inspiration die, Expertise, Song of Rest, Magical Secrets, Epic Boon and capstones
- Sorcerer 2014 and 2024 class feature checkpoints
- Sorcerer known/prepared spell tables
- Sorcery Points, Metamagic choices, Sorcerous Restoration and subclass levels
- Complete 2024 Bard and Sorcerer subclass manifests and feature levels

## Verification
- 162 test files passed
- 658 tests passed
- 0 failures
- TypeScript build passed
- Vite production build passed
- PWA generateSW passed with 85 precache entries

The existing App.css late @import warning remains unrelated to this package.
