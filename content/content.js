import { scrapeAll } from "./scrape.js";
import { buildLabelHTML } from "./templates.js";
import { openPrintWindow } from "./print.js";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PRINT_LABEL_PREVIEW" || msg?.type === "PRINT_LABEL_SILENT") {
      try {
        const { labelType, options, page, targetPrinterId, debug } = msg.payload || {};
        const data = await scrapeAll(labelType);
        const html = await buildLabelHTML(labelType, data, options, page);

        if (msg.type === "PRINT_LABEL_PREVIEW") {
          // Dev/test path: just open a live preview tab (no OS dialog if you avoid window.print inside the doc)
          const win = window.open("", "_blank", "noopener,noreferrer,width=600,height=900");
          if (!win) throw new Error("Pop-up blocked. Allow pop-ups for this site.");
          win.document.open();
          // Remove auto-print to avoid invoking OS dialog in preview:
          const safeHtml = html.replace("window.print()", "/* preview mode: no print */");
          win.document.write(safeHtml);
          win.document.close();

          console.log("[Preview] Would route to:", targetPrinterId, "page:", page, "debug:", debug);
          sendResponse({ ok: true });
          return;
        }

        // Silent path: use native host (agent) to render and submit
        const ok = await sendToNativeSilent({ html, labelType, page, targetPrinterId });
        sendResponse({ ok });
        return;
      } catch (err) {
        console.error(err);
        sendResponse({ ok: false, error: String(err.message || err) });
      }
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
        dataBase64: btoa(unescape(encodeURIComponent(html))) // agent will HTML→PDF and submit
      });
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}
