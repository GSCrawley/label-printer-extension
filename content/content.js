import { scrapeAll } from "./scrape.js";
import { buildLabelHTML } from "./templates.js";
import { openPrintWindow } from "./print.js";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'PRINT_LABEL') {
      try {
        const { labelType, options } = msg.payload || {};
        const data = await scrapeAll(labelType); // uses per-label selectors
        const html = await buildLabelHTML(labelType, data, options);
        await openPrintWindow(html);
        sendResponse({ ok: true });
      } catch (err) {
        console.error(err);
        sendResponse({ ok: false, error: String(err.message || err) });
      }
      return; // keep channel open for async
    }
  })();
  return true;
});
