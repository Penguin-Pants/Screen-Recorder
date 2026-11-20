// Chrome build only: service worker that replaces src/background.js.
// The toolbar button opens the recorder, and the badge shows the recording
// state. A service worker can stop at any time, so it keeps no state in
// variables: it finds recorder pages with runtime.getContexts(), and keeps
// the ID of the tab it opened last in storage.session.
'use strict';

const RECORDER_URL = chrome.runtime.getURL('recorder.html');
const OPENED_KEY = 'openedRecorderId';
// While the tab this worker opened still loads, a click waits up to this
// long for the recorder page in it (see waitForRecorderPage).
const LOADING_WAIT_MS = 5000;
// Toolbar clicks are handled one after the other, so fast clicks cannot
// open two recorders.
let openQueue = Promise.resolve();

chrome.action.onClicked.addListener(() => {
  const run = openQueue.then(showOrOpenRecorder);
  openQueue = run.catch((error) => console.error('Could not open the recorder:', error));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.action === 'recordingState') setRecordingBadge(message.state);
  return undefined;
});

// When the last recorder tab closes, clear the badge.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const open = (await recorderContexts()).filter((context) => context.tabId !== tabId);
  if (open.length === 0) setRecordingBadge('idle');
});

async function recorderContexts() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] });
  return contexts.filter((context) => context.documentUrl && context.documentUrl.startsWith(RECORDER_URL));
}

const hasRecorderPage = async (tabId) => (await recorderContexts()).some((context) => context.tabId === tabId);

// Show the first of these tabs that still exists. Resolves false if none does.
async function showTab(tabIds) {
  for (const tabId of tabIds) {
    const tab = await chrome.tabs.update(tabId, { active: true }).catch(() => null);
    if (tab) {
      await chrome.windows.update(tab.windowId, { focused: true });
      return true;
    }
  }
  return false;
}

// Show a recorder page, or the tab this worker opened if it gets the
// recorder page, or open a new recorder tab. A tab that loaded another page
// is not used.
async function showOrOpenRecorder() {
  if (await showTab((await recorderContexts()).map((context) => context.tabId))) return;
  const { [OPENED_KEY]: openedId } = await chrome.storage.session.get(OPENED_KEY);
  if (typeof openedId === 'number' && await waitForRecorderPage(openedId) && await showTab([openedId])) return;
  const tab = await chrome.tabs.create({ url: RECORDER_URL });
  await chrome.storage.session.set({ [OPENED_KEY]: tab.id });
}

// True when the tab has the recorder page. While the tab still loads, its
// page may not exist yet (the tab URL is not visible without the "tabs"
// permission), so wait for it, up to LOADING_WAIT_MS.
async function waitForRecorderPage(tabId) {
  const until = Date.now() + LOADING_WAIT_MS;
  while (!await hasRecorderPage(tabId)) {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    // Closed, loaded, or too slow. Check once more: the page can be new.
    if (!tab || tab.status !== 'loading' || Date.now() >= until) return hasRecorderPage(tabId);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return true;
}

function setRecordingBadge(state) {
  const badges = {
    recording: { text: 'REC', color: '#F04444' },
    paused: { text: '||', color: '#6b6b6b' },
    idle: { text: '', color: '#6b6b6b' }
  };
  const badge = badges[state] || badges.idle;
  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });
}
