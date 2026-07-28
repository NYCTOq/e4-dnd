import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
if (!fs.existsSync(packagePath)) throw new Error('package.json not found');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8').replace(/^\uFEFF/, ''));
pkg.version = '5.141.1';
pkg.dependencies ??= {};
pkg.devDependencies ??= {};

// Pin below the RSC-only advisory range. The app is a classic SPA, but the pin
// also makes npm audit production output deterministic without an allow-list.
pkg.dependencies['react-router-dom'] = '7.11.0';
if (pkg.dependencies['react-router']) pkg.dependencies['react-router'] = '7.11.0';
if (pkg.devDependencies['react-router']) pkg.devDependencies['react-router'] = '7.11.0';

// vite-plugin-pwa executes during build and belongs in devDependencies.
const pwaVersion = pkg.dependencies['vite-plugin-pwa'] ?? pkg.devDependencies['vite-plugin-pwa'] ?? '^1.3.0';
delete pkg.dependencies['vite-plugin-pwa'];
pkg.devDependencies['vite-plugin-pwa'] = pwaVersion;

pkg.scripts ??= {};
pkg.scripts['audit:production'] = 'npm audit --omit=dev --audit-level=high';
pkg.scripts['certify:security-hardening-d1'] = 'npm run audit:production && npm run test:critical && npm run build';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('package.json updated: router pinned to 7.11.0; vite-plugin-pwa moved to devDependencies.');
