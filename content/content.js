// Content scripts are classic scripts (not ESM). Use dynamic import for modules.
let __modsPromise = null;
function loadMods() {
  if (!__modsPromise) {
    __modsPromise = Promise.all([
      import(chrome.runtime.getURL("content/scrape.js")),
      import(chrome.runtime.getURL("content/templates.js")),
    ]).then(([scrapeMod, tmplMod]) => ({
      scrapeAll: scrapeMod.scrapeAll,
      buildLabelHTML: tmplMod.buildLabelHTML,
    }));
  }
  return __modsPromise;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PRINT_LABEL_PREVIEW" || msg?.type === "PRINT_LABEL_SILENT") {
      try {
        const { labelType, options, page, targetPrinterId } = msg.payload || {};
        const mode = msg.type === "PRINT_LABEL_SILENT" ? "silent" : "preview";

        // Open the preview window IMMEDIATELY to preserve user gesture and avoid popup blockers
        const previewUrl = chrome.runtime.getURL("preview/preview.html");
        const previewWin = window.open(previewUrl, "_blank", "noopener,noreferrer,width=720,height=980");
        if (!previewWin) throw new Error("Pop-up blocked. Allow pop-ups for this site.");

  // Now do async work
  const { scrapeAll, buildLabelHTML } = await loadMods();
  const data = await scrapeAll(labelType);
  const html = await buildLabelHTML(labelType, data, options, page);

        // Post payload to the already-open preview window
        setTimeout(() => {
          try {
            previewWin.postMessage({
              type: "LABEL_PREVIEW_PAYLOAD",
              payload: { html, labelType, page, targetPrinterId, mode }
            }, "*");
          } catch (e) {
            console.error("Failed to post preview payload:", e);
          }
        }, 150);

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
