// Chrome build only. The pages use the Firefox `browser` namespace. In
// Chrome (Manifest V3), the `chrome` namespace returns promises too.
'use strict';
globalThis.browser = globalThis.browser || chrome;
