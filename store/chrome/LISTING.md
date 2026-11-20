# Chrome Web Store listing: copy-paste answers

Use this file in the Chrome Web Store Developer Dashboard (https://chrome.google.com/webstore/devconsole). Each block in a code fence is ready to paste.

Sources: Chrome Web Store docs, read November 20, 2026 (links at the end). Items marked "unverified" come from no official page. Check them in the dashboard.

## 1. Before you start (one time)

1. Turn on 2-Step Verification for your Google account. All developer accounts must have it.
2. Register at https://chrome.google.com/webstore/devconsole and pay the one-time registration fee. The amount shows in the dashboard (unverified: US$5).
3. In **Account**, set **Publisher name** (required) and verify your **contact email**. You cannot change the developer email later.
4. In **Account**, answer the trader declaration (unverified: the EU Digital Services Act question). This is your decision: a person who publishes a free extension as a hobby is usually a non-trader. A business is a trader.
5. A new publisher can publish a maximum of 2 extensions.

## 2. Package

Upload this file (make it with `npm run build:chrome`):

```
dist/screen-recorder-chrome-2.2.0.zip
```

## 3. Store listing tab

### Title (from the manifest)

```
Screen Recorder
```

### Summary (from the manifest `description`, 132 characters or less; this one is 130)

```
Record your screen with your webcam and microphone, and save small videos that are easy to share. Everything stays on your device.
```

### Description

```
Record your screen, a window or a tab, with your webcam and microphone. Save small videos that are easy to share. All recording and processing happens on your device. Nothing is uploaded.

RECORD
• Screen, window or tab, with your microphone. A level meter shows that the microphone hears you. If the microphone gives no sound, the recorder tells you.
• Webcam: you see yourself while you record, and your camera shows as a round bubble in a corner of the saved video.
• Computer sound (a video, a call, music) from a loopback device such as Stereo Mix, mixed with your microphone.
• Quality presets from 480p to full size, with an estimate in MB per minute. Default: up to 1080p, 30 fps, about 15 MB per minute.
• Countdown, pause and resume, live file size, and a REC badge on the toolbar button.

AFTER YOU STOP
• Watch the recording before you save it.
• Move the camera bubble to any corner, change its size, or hide it.
• Save the recording as it is, or a smaller copy (High 1080p, Medium 720p, Small 480p, Tiny 360p). Each preset shows its estimated size.
• WebM, or MP4 where your computer can encode H.264.
• Saved files have a duration index, so video players can seek in them.
• Or turn on "Save at once" in Settings to skip the review step.

PRIVATE BY DESIGN
• Only 2 permissions: downloads (to save your videos) and storage (to keep your settings).
• The extension cannot read the websites that you visit.
• No account, no analytics, no tracking, no ads.
• Chrome asks you before the extension can use your screen, camera or microphone.

HOW TO USE
1. Click the toolbar button (or press Alt+Shift+R).
2. Choose the quality. Tick Include microphone or Include camera if you want them.
3. Click Start recording and choose what to share.
4. Click Stop. Choose the size, then click Save.

The source code is open (AGPL-3.0): https://github.com/Penguin-Pants/Screen-Recorder
```

### Category

```
Tools
```

### Language

```
English (United States)
```

### Graphic assets (all in `store/chrome/`)

| Field | File | Size | Required |
| --- | --- | --- | --- |
| Store icon | `store-icon-128.png` | 128x128 | Yes |
| Screenshots (upload in this order) | `1-setup.png`, `2-recording.png`, `3-review.png`, `4-settings.png` | 1280x800 | At least 1, max 5 |
| Small promo tile | `small-promo-440x280.png` | 440x280 | No (recommended) |
| Marquee promo tile | `marquee-promo-1400x560.png` | 1400x560 | No |
| Global promo video (YouTube) | none | | No |

The screenshots show the real extension with a sample slide and a sample camera image.

### Additional fields

Homepage URL:

```
https://github.com/Penguin-Pants/Screen-Recorder
```

Support URL:

```
https://github.com/Penguin-Pants/Screen-Recorder/issues
```

Official URL: leave empty (it needs a verified site).

Mature content: leave unticked.

## 4. Privacy tab

### Single purpose description

```
Record the screen, a window or a tab, with the optional webcam and microphone, and save the recording as a video file on the user's device.
```

### Permission justification: downloads

```
Saves the user's recordings as video files to the Downloads folder (or the folder that the user chooses). The extension uses it only when the user clicks Save, or when the user turned on "Save at once".
```

### Permission justification: storage

```
Keeps the user's settings on the device: recording quality, countdown, camera position and size, download subfolder, and the camera and microphone that the user chose. No other data is stored.
```

### Host permissions

None. The extension asks for no host permissions and has no content scripts. If the dashboard shows a host permission field, it does not apply.

### Remote code

Select:

```
No, I am not using remote code.
```

All code is in the package. The video library (Mediabunny 1.61.0) is included as a local file.

### Data usage: what user data do you collect?

Tick **none** of the boxes. The extension sends no data off the device. Screen, camera and microphone data stay in memory on the device until the user saves a file to their own disk. (Unverified: the dashboard box names, for example "Personally identifiable information", "Health information", "Financial and payment information", "Authentication information", "Personal communications", "Location", "Web history", "User activity", "Website content".)

### Data usage: certifications

Tick all 3 boxes. They are true for this extension. (Unverified wording: "I do not sell or transfer user data to third parties, outside of the approved use cases", "I do not use or transfer user data for purposes that are unrelated to my item's single purpose", "I do not use or transfer user data to determine creditworthiness or for lending purposes".)

### Privacy policy URL

```
https://github.com/Penguin-Pants/Screen-Recorder/blob/main/PRIVACY.md
```

This link works only after `PRIVACY.md` is on the `main` branch.

## 5. Distribution tab

- **Payments:** Free of charge.
- **Visibility:** Public (anyone can find it). Choose Unlisted if only people with the link should install it.
- **Regions:** All regions.

## 6. Test instructions tab (optional)

```
No account or login is needed.
1. Click the toolbar button. The recorder opens in a new tab.
2. Optional: tick Include microphone and Include camera, and allow them.
3. Click Start recording. Chrome asks what to share. Choose a tab or a screen.
4. After a few seconds, click Stop. The review screen shows the video.
5. Choose a size and click Save. The file saves to the Downloads folder.
Settings: the Settings link at the bottom of the recorder page.
```

## 7. After you submit

- The dashboard shows the review status.
- For each new version: change `version` in `src/manifest.json` and `package.json`, run `npm run build:chrome`, then upload the new ZIP in the **Package** tab.

## Sources

- https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/set-up-account
- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/best-listing
- https://developer.chrome.com/docs/webstore/best_practices
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
