// Behavior of the Chrome service worker (chrome/background.js), run in a
// Node VM with a fake `chrome` API.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'chrome', 'background.js'), 'utf8');
const ORIGIN = 'chrome-extension://test-id/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const event = () => ({ listeners: [], addListener(listener) { this.listeners.push(listener); } });

// A fake browser. A new tab is 'loading'. After `page` ms it has the
// recorder page, or after `other` ms another page (plans in `plans`).
function fakeChrome() {
  const tabs = new Map();
  const docs = new Map(); // tabId -> document URL
  const session = {};
  const calls = { created: 0, shown: [], focused: [], badge: [] };
  const plans = [];
  let nextId = 100;
  const chrome = {
    runtime: {
      getURL: (file) => ORIGIN + file,
      getContexts: async () => [...docs].map(([tabId, documentUrl]) => ({ tabId, documentUrl })),
      onMessage: event()
    },
    action: {
      onClicked: event(),
      setBadgeText: ({ text }) => calls.badge.push(text),
      setBadgeBackgroundColor: () => {}
    },
    tabs: {
      onRemoved: event(),
      create: async () => {
        calls.created++;
        const tab = { id: nextId++, windowId: 3, status: 'loading' };
        tabs.set(tab.id, tab);
        const plan = plans.shift() || { page: 20 };
        setTimeout(() => {
          if (!tabs.has(tab.id)) return;
          docs.set(tab.id, plan.page !== undefined ? `${ORIGIN}recorder.html` : `${ORIGIN}options.html`);
          tab.status = 'complete';
        }, plan.page ?? plan.other);
        return { ...tab };
      },
      get: async (id) => {
        if (!tabs.has(id)) throw new Error(`No tab with id: ${id}.`);
        return { ...tabs.get(id) };
      },
      update: async (id) => {
        if (!tabs.has(id)) throw new Error(`No tab with id: ${id}.`);
        calls.shown.push(id);
        return { ...tabs.get(id) };
      }
    },
    windows: { update: async (id) => { calls.focused.push(id); } },
    storage: {
      session: {
        get: async (key) => (key in session ? { [key]: session[key] } : {}),
        set: async (values) => { Object.assign(session, values); }
      }
    }
  };
  const close = (id) => {
    tabs.delete(id);
    docs.delete(id);
    chrome.tabs.onRemoved.listeners.forEach((listener) => listener(id));
  };
  return { chrome, calls, plans, close };
}

function loadWorker() {
  const fake = fakeChrome();
  const context = vm.createContext({ chrome: fake.chrome, console, setTimeout });
  vm.runInContext(SOURCE, context);
  const click = () => fake.chrome.action.onClicked.listeners[0]();
  // Resolves when all clicks so far are handled.
  const settled = () => vm.runInContext('openQueue', context);
  return { ...fake, click, settled };
}

test('Chrome worker: a click opens a recorder, the next click shows it', async () => {
  const worker = loadWorker();
  worker.click();
  await worker.settled();
  await sleep(40);
  worker.click();
  await worker.settled();
  assert.equal(worker.calls.created, 1);
  assert.deepEqual(worker.calls.shown, [100]);
  assert.deepEqual(worker.calls.focused, [3]);
});

test('Chrome worker: fast clicks while the recorder loads open one tab', async () => {
  const worker = loadWorker();
  worker.click();
  worker.click();
  worker.click();
  await worker.settled();
  assert.equal(worker.calls.created, 1);
  assert.deepEqual(worker.calls.shown, [100, 100]);
});

test('Chrome worker: a slow recorder page still gets one tab', async () => {
  const worker = loadWorker();
  worker.plans.push({ page: 300 });
  worker.click();
  worker.click();
  await worker.settled();
  assert.equal(worker.calls.created, 1);
  assert.deepEqual(worker.calls.shown, [100]);
});

test('Chrome worker: a tab that loaded another page is not shown', async () => {
  const worker = loadWorker();
  worker.plans.push({ other: 30 });
  worker.click();
  worker.click();
  await worker.settled();
  assert.equal(worker.calls.created, 2);
  assert.deepEqual(worker.calls.shown, []);
});

test('Chrome worker: a closed tab is not shown, a click opens a new one', async () => {
  const worker = loadWorker();
  worker.click();
  await worker.settled();
  worker.close(100);
  worker.click();
  await worker.settled();
  assert.equal(worker.calls.created, 2);
});

test('Chrome worker: badge follows the recording and clears when the last recorder closes', async () => {
  const worker = loadWorker();
  worker.click();
  await worker.settled();
  await sleep(40);
  const onMessage = worker.chrome.runtime.onMessage.listeners[0];
  onMessage({ action: 'recordingState', state: 'recording' });
  onMessage({ action: 'recordingState', state: 'paused' });
  onMessage({ action: 'other' });
  worker.close(100);
  await sleep(0);
  assert.deepEqual(worker.calls.badge, ['REC', '||', '']);
});
