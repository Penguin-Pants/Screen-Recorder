// Make the Chrome build from src/: dist/chrome/ (load unpacked) and
// dist/screen-recorder-chrome-<version>.zip. Files from src/ are copied,
// with these changes:
// - manifest.json: Manifest V3 (service worker, "action", no gecko keys).
// - background.js: replaced by chrome/background.js.
// - HTML pages: chrome/browser-shim.js loads first (`browser` = `chrome`).
// - Text: "Firefox" becomes "Chrome", and the shortcut hint points to the
//   Chrome shortcut page.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const out = path.join(dist, 'chrome');

function chromeManifest(firefox) {
  const manifest = {
    manifest_version: 3,
    name: firefox.name,
    version: firefox.version,
    description: firefox.description,
    minimum_chrome_version: '120',
    icons: firefox.icons,
    permissions: firefox.permissions,
    background: { service_worker: 'background.js' },
    action: firefox.browser_action,
    options_ui: firefox.options_ui,
    commands: {}
  };
  for (const [name, command] of Object.entries(firefox.commands || {})) {
    manifest.commands[name === '_execute_browser_action' ? '_execute_action' : name] = command;
  }
  return manifest;
}

function chromeText(text) {
  return text
    .replace('open <strong>about:addons</strong>, click the gear icon, then <strong>Manage Extension Shortcuts</strong>',
      'open <strong>chrome://extensions/shortcuts</strong>')
    .replace(/Firefox/g, 'Chrome');
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });

const firefox = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'manifest.json'), `${JSON.stringify(chromeManifest(firefox), null, 2)}\n`);
fs.copyFileSync(path.join(root, 'chrome', 'background.js'), path.join(out, 'background.js'));
fs.copyFileSync(path.join(root, 'chrome', 'browser-shim.js'), path.join(out, 'browser-shim.js'));

for (const name of fs.readdirSync(out)) {
  if (!/\.(html|js)$/.test(name) || name === 'background.js' || name === 'browser-shim.js') continue;
  const file = path.join(out, name);
  let text = chromeText(fs.readFileSync(file, 'utf8'));
  if (name.endsWith('.html')) {
    if (!text.includes('<script src="common.js"></script>')) throw new Error(`${name}: no common.js script tag`);
    text = text.replace('<script src="common.js"></script>', '<script src="browser-shim.js"></script>\n  <script src="common.js"></script>');
  }
  fs.writeFileSync(file, text);
}

const zip = path.join(dist, `screen-recorder-chrome-${firefox.version}.zip`);
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.'], { cwd: out });
console.log(`Chrome build: ${path.relative(root, out)}/ and ${path.relative(root, zip)}`);
