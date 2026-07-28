import fs from 'node:fs';
const p='package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
pkg.version='5.137.0';
pkg.scripts={...pkg.scripts,
 'audit:full-playability':'node scripts/full-playability-audit-v5.137.mjs',
 'certify:full-playability':'npm run audit:full-playability && npm run build'
};
fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('v5.137 scripts installed; package version 5.137.0.');
