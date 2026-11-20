// The Chrome build (scripts/build-chrome.js) makes a Manifest V3 copy of src/.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'dist', 'chrome');

test('Chrome build', async (t) => {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-chrome.js')], { stdio: 'pipe' });
  const firefox = JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));

  await t.test('manifest is Manifest V3 with the same name, version and permissions', () => {
    assert.strictEqual(manifest.manifest_version, 3);
    assert.strictEqual(manifest.version, firefox.version);
    assert.deepStrictEqual(manifest.permissions, firefox.permissions);
    assert.deepStrictEqual(manifest.background, { service_worker: 'background.js' });
    assert.ok(manifest.action);
    assert.ok(manifest.commands._execute_action);
    assert.strictEqual(manifest.browser_specific_settings, undefined);
  });

  await t.test('pages load the browser shim before common.js', () => {
    for (const page of ['recorder.html', 'options.html']) {
      const html = fs.readFileSync(path.join(out, page), 'utf8');
      const shim = html.indexOf('<script src="browser-shim.js">');
      assert.ok(shim >= 0 && shim < html.indexOf('<script src="common.js">'), page);
    }
  });

  await t.test('background is the Chrome service worker and text names Chrome', () => {
    assert.strictEqual(fs.readFileSync(path.join(out, 'background.js'), 'utf8'),
      fs.readFileSync(path.join(root, 'chrome', 'background.js'), 'utf8'));
    for (const file of ['recorder.js', 'recorder.html', 'options.html', 'common.js']) {
      assert.ok(!fs.readFileSync(path.join(out, file), 'utf8').includes('Firefox'), file);
    }
  });

  await t.test('text makes no Firefox-only claims about Chrome', () => {
    const html = fs.readFileSync(path.join(out, 'recorder.html'), 'utf8');
    assert.ok(!html.includes('Chrome does not give the sound of a tab'), 'Chrome can share tab sound');
    const js = fs.readFileSync(path.join(out, 'recorder.js'), 'utf8');
    assert.ok(!js.includes('Chrome 130'), `minimum is Chrome ${manifest.minimum_chrome_version}`);
    assert.ok(js.includes(`Chrome ${manifest.minimum_chrome_version} or later`));
  });

  await t.test('ZIP is made', () => {
    assert.ok(fs.existsSync(path.join(root, 'dist', `screen-recorder-chrome-${firefox.version}.zip`)));
  });
});
