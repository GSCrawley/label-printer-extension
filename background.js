async function getPrintMode() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ printMode: "preview" }, ({ printMode }) => resolve(printMode));
  });
}

async function setBadgeForMode(mode) {
  const isSilent = mode === "silent";
  await chrome.action.setBadgeText({ text: isSilent ? "S" : "P" });
  await chrome.action.setBadgeBackgroundColor({ color: isSilent ? "#d35400" : "#2ecc71" }); // orange vs green
  await chrome.action.setTitle({
    title: isSilent ? "Silent print mode" : "Preview print mode"
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const mode = await getPrintMode();
  setBadgeForMode(mode);
});

chrome.runtime.onStartup.addListener(async () => {
  const mode = await getPrintMode();
  setBadgeForMode(mode);
});

// Keep badge in sync when printMode changes from anywhere (popup or shortcut)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.printMode) {
    const newMode = changes.printMode.newValue;
    setBadgeForMode(newMode);
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-print-mode") {
    chrome.storage.sync.get({ printMode: "preview" }, ({ printMode }) => {
      const newMode = printMode === "silent" ? "preview" : "silent";
      chrome.storage.sync.set({ printMode: newMode }, () => {
        console.log("[Extension] Print mode toggled:", newMode);

        // optional: show a toast/notification when it flips
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Print Mode Toggled",
          message: newMode === "silent" ? "Silent mode enabled" : "Preview mode enabled"
        });
      });
    });
  }
});

// background.js (append to your existing code)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "PREVIEW_SILENT_PRINT") {
      try {
        const { html, labelType, page, targetPrinterId } = message.payload || {};
         const ok = await sendToNativeSilent({ html, labelType, page, targetPrinterId });
        sendResponse({ ok });
      } catch (e) {
        console.error(e);
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    }
  })();
  return true;
});

async function sendToNativeSilent({ html, labelType, page, targetPrinterId }) {
  try {
    const port = chrome.runtime.connectNative("com.client.proshop_printer");
    return await new Promise((resolve, reject) => {
      port.onMessage.addListener((m) => (m?.ok ? resolve(true) : reject(m?.error || "Native host error")));
      port.onDisconnect.addListener(() => resolve(false));
      port.postMessage({
        action: "print",
        labelType,
        page,
        targetPrinterId,
        mime: "text/html",
        dataBase64: btoa(unescape(encodeURIComponent(html))) // agent renders HTML -> PDF and submits
      });
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}

getPrintMode().then(setBadgeForMode);
