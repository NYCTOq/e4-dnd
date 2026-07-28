import fs from 'node:fs';
const file='package.json';
const pkg=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
pkg.version='5.138.0';
pkg.scripts={...pkg.scripts,
  'audit:content-coverage':'node scripts/content-coverage-matrix-v5.138.mjs',
  'verify:content-coverage':'node scripts/verify-content-coverage-v5.138.mjs',
  'certify:content-coverage':'npm run audit:content-coverage && npm run verify:content-coverage && npm run build'
};
fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('v5.138 scripts installed; package version 5.138.0.');
