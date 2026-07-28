import fs from 'node:fs';
const p='reports/CONTENT_COVERAGE_MATRIX_v5.138.json';
if(!fs.existsSync(p)) throw new Error('coverage JSON missing');
const report=JSON.parse(fs.readFileSync(p,'utf8'));
const required=['class','subclass','spell','feat','item'];
for(const d of required){if(!report.summary.some(x=>x.domain===d&&x.total>0))throw new Error(`missing or empty domain: ${d}`);}
if(report.rows.some(r=>!['READY','PARTIAL','GAP'].includes(r.status)))throw new Error('invalid status');
if(report.rows.some(r=>!['automatic','partial','manual'].includes(r.mode)))throw new Error('invalid mode');
console.log(`v5.138 verification passed: ${report.total} rows; ${report.summary.length} domains.`);
