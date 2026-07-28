import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const testPath = path.join(root, 'src/core/rulesets/featItemRuntimeCompletion-v5.133.test.ts');
if (!fs.existsSync(testPath)) throw new Error(`Missing test file: ${testPath}`);

let source = fs.readFileSync(testPath, 'utf8');
const oldFixture = 'const item = { id: "wand", name: "Wand", ruleset: "dnd_2014", category: "gear", rarity: "rare", description: "", weight: 1, cost: "1 gp", costGp: 1, charges: 7, chargeCost: 1, requiresAttunement: true } satisfies DndItemData;';
const newFixture = 'const item = { id: "wand", name: "Wand", category: "gear", rarity: "rare", description: "", weight: 1, cost: "1 gp", charges: 7, chargeCost: 1, requiresAttunement: true } satisfies DndItemData;';

const count = source.split(oldFixture).length - 1;
if (count !== 1) throw new Error(`Fixture anchor mismatch: expected 1, found ${count}`);
source = source.replace(oldFixture, newFixture);
fs.writeFileSync(testPath, source);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = '5.133.2';
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

console.log('v5.133D2 exact DndItemData fixture hotfix applied.');
