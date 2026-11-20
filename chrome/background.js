// Chrome build only: service worker that replaces src/background.js.
// The toolbar button opens the recorder, and the badge shows the recording
// state. A service worker can stop at any time, so it keeps no state in
// variables: it finds the recorder tab with runtime.getContexts().
'use strict';

const RECORDER_URL = chrome.runtime.getURL('recorder.html');
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

async function showOrOpenRecorder() {
  for (const context of await recorderContexts()) {
    const tab = await chrome.tabs.update(context.tabId, { active: true }).catch(() => null);
    if (tab) {
      await chrome.windows.update(tab.windowId, { focused: true });
      return;
    }
  }
  await chrome.tabs.create({ url: RECORDER_URL });
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
