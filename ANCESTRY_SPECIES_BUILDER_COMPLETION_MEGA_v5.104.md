# E4 D&D v5.104 — Ancestry & Species Builder Completion Mega Pack

## Kapsam

### 2024

- Human Skillful: 1 skill seçimi
- Human Versatile: 1 ek Origin Feat seçimi
- Human/Aasimar/Tiefling Small veya Medium seçimi
- Aasimar Celestial Revelation
- Dragonborn Draconic Ancestry
- Elf Elven Lineage ve Keen Senses skill seçimi
- Gnome Gnomish Lineage
- Goliath Giant Ancestry
- Halfling otomatik Stealth
- Orc aktif özellik bildirimleri
- Tiefling Fiendish Legacy ve legacy spell listesi
- Dwarf mevcut HP/resistance/darkvision runtime'ı korunur

### 2014

- Human ekstra language
- Half-Elf iki ekstra skill ve language
- Half-Orc otomatik Intimidation
- Elf otomatik Perception
- High Elf Wizard cantrip ve language
- Dragonborn Draconic Ancestry
- Tiefling level bazlı ancestry spell'leri
- Forest Gnome Minor Illusion
- Mevcut subrace ability ve ancestry runtime hesapları korunur

## Uygulama

ZIP içeriğini proje köküne kopyalayın.

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ANCESTRY_MEGA_PATCH.ps1
```

Ayrı çalıştırmak için:

```powershell
node .\scripts\apply-ancestry-builder-mega-patch.mjs
npm.cmd run verify:ancestry-mega
```

## Not

Bu paket builder seçimlerini, kayıt alanlarını ve otomatik grant katmanını tamamlar.
Breath Weapon, Relentless Endurance, Healing Hands ve benzeri aktif özelliklerin
tam savaş çözümlemesi combat runtime sertifikasyonunda ayrıca doğrulanmalıdır.
