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

getPrintMode().then(setBadgeForMode);
