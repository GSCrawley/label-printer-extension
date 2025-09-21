import { scrapeAll } from "./scrape.js";
import { buildLabelHTML } from "./templates.js";
import { openPrintWindow } from "./print.js";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PRINT_LABEL" || msg?.type === "PRINT_LABEL_SILENT") {
      try {
        const { labelType, options, page, targetPrinterId } = msg.payload || {};
        const data = await scrapeAll(labelType);
        const html = await buildLabelHTML(labelType, data, options, page);

        if (msg.type === "PRINT_LABEL_SILENT") {
          // hand off to native agent for silent routing (recommended)
          const ok = await sendToNativeSilent({ html, labelType, page, targetPrinterId });
          sendResponse({ ok });
        } else {
          await openPrintWindow(html); // dev / manual mode
          sendResponse({ ok: true });
        }
      } catch (err) {
        console.error(err);
        sendResponse({ ok: false, error: String(err.message || err) });
      }
      return;
    }
  })();
  return true;
});

async function sendToNativeSilent({ html, labelType, page, targetPrinterId }) {
  try {
    const port = chrome.runtime.connectNative("com.client.proshop_printer");
    return await new Promise((resolve, reject) => {
      port.onMessage.addListener(m => (m?.ok ? resolve(true) : reject(m?.error || "Native host error")));
      port.onDisconnect.addListener(() => resolve(false));
      port.postMessage({
        action: "print",
        labelType,
        page,
        targetPrinterId,
        mime: "text/html",
        dataBase64: btoa(unescape(encodeURIComponent(html))) // simple encode; agent renders HTML→PDF
      });
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}
