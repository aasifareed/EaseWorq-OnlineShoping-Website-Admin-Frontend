/**
 * ng2-material-dropdown@1.0.0 ships broken / incomplete entries.
 * patch-package restores fesm2015/ng2-material-dropdown.js and removes .mjs.
 * After ngcc (or on some installs) webpack still resolves .mjs — keep both in sync.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'node_modules', 'ng2-material-dropdown', 'fesm2015');
const jsPath = path.join(dir, 'ng2-material-dropdown.js');
const mjsPath = path.join(dir, 'ng2-material-dropdown.mjs');

if (!fs.existsSync(jsPath)) {
  console.error('ensure-ng2-material-dropdown: missing', jsPath);
  console.error('Did patch-package apply patches/ng2-material-dropdown+1.0.0.patch?');
  process.exit(1);
}

fs.copyFileSync(jsPath, mjsPath);
console.log('ensure-ng2-material-dropdown: synced .mjs from .js');
