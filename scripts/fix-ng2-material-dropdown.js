/**
 * ng2-material-dropdown@1.0.0 is incomplete on npm. Restore a working build
 * entry after install (same approach as Fareed-Mart-Frontend-NewTheme).
 *
 * 1) Try patch-package (best effort — may fail if published package changed)
 * 2) Ensure fesm2015/*.js exists (copy from scripts/vendor if needed)
 * 3) Point package.json module/exports at .js (not .mjs)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const pkgDir = path.join(root, 'node_modules', 'ng2-material-dropdown');
const fesmDir = path.join(pkgDir, 'fesm2015');
const jsPath = path.join(fesmDir, 'ng2-material-dropdown.js');
const mjsPath = path.join(fesmDir, 'ng2-material-dropdown.mjs');
const vendorJs = path.join(__dirname, 'vendor', 'ng2-material-dropdown.js');
const packageJsonPath = path.join(pkgDir, 'package.json');

function log(msg) {
  console.log(`[fix-ng2-material-dropdown] ${msg}`);
}

if (!fs.existsSync(pkgDir)) {
  log('package not installed — skip');
  process.exit(0);
}

// Best-effort patch-package (do not fail install if patch no longer applies)
const patch = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['patch-package'],
  { cwd: root, encoding: 'utf8', shell: true }
);
if (patch.status === 0) {
  log('patch-package applied');
} else {
  log('patch-package skipped/failed — using vendor fallback if needed');
  if (patch.stdout) process.stdout.write(patch.stdout);
  if (patch.stderr) process.stderr.write(patch.stderr);
}

fs.mkdirSync(fesmDir, { recursive: true });

if (!fs.existsSync(jsPath)) {
  if (!fs.existsSync(vendorJs)) {
    console.error('Missing vendor file:', vendorJs);
    process.exit(1);
  }
  fs.copyFileSync(vendorJs, jsPath);
  log('copied vendor JS into fesm2015/');
}

// Keep .mjs in sync for resolvers that still look for it
fs.copyFileSync(jsPath, mjsPath);

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const toJs = (v) => (typeof v === 'string' ? v.replace(/\.mjs$/i, '.js') : v);

  if (pkg.module) pkg.module = toJs(pkg.module);
  if (pkg.es2020) pkg.es2020 = toJs(pkg.es2020);
  if (pkg.esm2020) pkg.esm2020 = toJs(pkg.esm2020);
  if (pkg.fesm2020) pkg.fesm2020 = toJs(pkg.fesm2020);
  if (pkg.fesm2015) pkg.fesm2015 = toJs(pkg.fesm2015);
  if (pkg.main && String(pkg.main).includes('dist/')) {
    // Prefer the fesm build; dist is often missing from the published tarball
    pkg.main = 'fesm2015/ng2-material-dropdown.js';
  }

  if (pkg.exports && pkg.exports['.']) {
    const exp = pkg.exports['.'];
    ['types', 'esm2020', 'es2020', 'es2015', 'node', 'default', 'import', 'require'].forEach((k) => {
      if (exp[k]) exp[k] = toJs(exp[k]);
    });
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  log('updated package.json to prefer .js entries');
}

log('ready');
