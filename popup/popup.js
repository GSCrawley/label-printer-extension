// async function sendToActiveTab(message) {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//   return chrome.tabs.sendMessage(tab.id, message);
// }

// document.getElementById('printBtn').addEventListener('click', async () => {
//   const labelType = document.getElementById('labelType').value;
//   const barcodeOn = document.getElementById('barcodeOn').checked;

//   document.getElementById('status').textContent = 'Building label…';

//   try {
//     const res = await sendToActiveTab({
//       type: 'PRINT_LABEL',
//       payload: { labelType, options: { barcodeOn } }
//     });

//     document.getElementById('status').textContent = res?.ok
//       ? 'Sent to print window.'
//       : (res?.error || 'Unable to print on this page.');
//   } catch (e) {
//     document.getElementById('status').textContent = e.message;
//   }
// });

// popup/popup.js
import { LABEL_SPECS, PRINTERS, isLargeLabel } from "../content/specs.js";

const els = {
  type: document.getElementById("labelType"),
  barcode: document.getElementById("barcodeOn"),
  smallPrinters: document.getElementById("smallPrinters"),
  zebraInfo: document.getElementById("zebraInfo"),
  status: document.getElementById("status"),
  printBtn: document.getElementById("printBtn"),
  modeToggle: document.getElementById("modeToggle"),
  modeLabel: document.getElementById("modeLabel")
};

let chosenSmallPrinter = null;
let currentMode = "preview"; // "preview" | "silent"

function setModeClass() {
  document.body.classList.toggle("silent", currentMode === "silent");
  document.body.classList.toggle("preview", currentMode !== "silent");
}
// init: load saved mode
chrome.storage.sync.get({ printMode: "preview" }, ({ printMode }) => {
  currentMode = printMode;
  els.modeToggle.checked = (printMode === "silent");
  els.modeLabel.textContent = printMode === "silent" ? "Silent mode" : "Preview mode";
  setModeClass();  
});

// save on change
els.modeToggle.addEventListener("change", () => {
  currentMode = els.modeToggle.checked ? "silent" : "preview";
  els.modeLabel.textContent = els.modeToggle.checked ? "Silent mode" : "Preview mode";
  chrome.storage.sync.set({ printMode: currentMode });
  setModeClass();   
});

function setSmallPrinter(id) {
  chosenSmallPrinter = id;
  document.querySelectorAll(".pbtn").forEach(b => {
    b.classList.toggle("active", b.dataset.printer === id);
  });
}

document.querySelectorAll(".pbtn").forEach(b => {
  b.addEventListener("click", () => setSmallPrinter(b.dataset.printer));
});

function refreshUI() {
  const labelType = els.type.value;
  const large = isLargeLabel(labelType);
  els.smallPrinters.hidden = large;     // only show Brother choices for small labels
  els.zebraInfo.hidden = !large;
  if (large) setSmallPrinter(null);
}
els.type.addEventListener("change", refreshUI);
refreshUI();

async function sendToActiveTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.sendMessage(tab.id, msg);
}

els.printBtn.addEventListener("click", async () => {
  els.status.textContent = "Building…";
  const labelType = els.type.value;
  const spec = LABEL_SPECS[labelType];
  const large = isLargeLabel(labelType);
  const barcodeOn = els.barcode.checked;

  // Determine desired printer target
  let targetPrinterId = null;

  if (large) {
    // Large labels default to Zebra
    targetPrinterId = PRINTERS.zebra_4x6.id;

    // Edge case: user *really* wants to push large label to small printer
    if (chosenSmallPrinter) {
      const sure = confirm(
        "This label is 4×6 and the selected printer is 62×100 mm.\n\n" +
        "Do you intentionally want to print it on a smaller label?\n" +
        "Press OK to use the smaller label; Cancel to send to the Zebra (4×6)."
      );
      if (sure) {
        // Route to the chosen Brother and also change the page size to 62×100
        targetPrinterId = chosenSmallPrinter;
        spec.width_mm = 62; spec.height_mm = 100; spec.margin_in = 0.16; spec.sizeKey = "62x100";
      } else {
        // ensure Zebra
        chosenSmallPrinter = null;
      }
    }
  } else {
    // Small labels must pick a Brother
    if (!chosenSmallPrinter) {
      els.status.textContent = "Choose a Brother printer (top of popup) for 62×100 labels.";
      return;
    }
    targetPrinterId = chosenSmallPrinter;
  }

   const messageType = currentMode === "silent" ? "PRINT_LABEL_SILENT" : "PRINT_LABEL_PREVIEW";

   try {
    const res = await sendToActiveTab({
      type: messageType,
      payload: {
        labelType,
        options: { barcodeOn },
        page: {
          width_mm: spec.width_mm,
          height_mm: spec.height_mm,
          orientation: spec.orientation,
          margin_in: spec.margin_in
        },
        targetPrinterId,
        debug: { mode: currentMode }
      }
    });
    els.status.textContent = res?.ok ? (currentMode === "silent" ? "Sent to printer." : "Opened preview.") : (res?.error || "Failed.");
  } catch (e) {
    els.status.textContent = e.message;
  }
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.printMode) {
    currentMode = changes.printMode.newValue;
    els.modeToggle.checked = (currentMode === "silent");
    els.modeLabel.textContent = currentMode === "silent" ? "Silent mode" : "Preview mode";
    setModeClass();
  }
});
});