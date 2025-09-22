import { scrapeAll } from "./scrape.js";
import { buildLabelHTML } from "./templates.js";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PRINT_LABEL_PREVIEW" || msg?.type === "PRINT_LABEL_SILENT") {
      try {
        const { labelType, options, page, targetPrinterId, debug } = msg.payload || {};
        const data = await scrapeAll(labelType);
        const html = await buildLabelHTML(labelType, data, options, page);

        // ALWAYS show preview UI, regardless of mode
        await openPreviewUI({ html, labelType, page, targetPrinterId, mode: (msg.type === "PRINT_LABEL_SILENT" ? "silent" : "preview") });

        sendResponse({ ok: true });
        return;
      } catch (err) {
        console.error(err);
        sendResponse({ ok: false, error: String(err.message || err) });
      }
    }
  })();
  return true;
});

async function openPreviewUI(payload) {
  const url = chrome.runtime.getURL("preview/preview.html");
  const win = window.open(url, "_blank", "noopener,noreferrer,width=720,height=980");
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups for this site.");
  // Wait a tick so preview page can attach its message listener
  setTimeout(() => {
    win.postMessage({ type: "LABEL_PREVIEW_PAYLOAD", payload }, "*");
  }, 150);
}
