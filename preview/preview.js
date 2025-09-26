// preview/preview.js
// Receives a payload from the opener and renders the label into an iframe.
// Provides buttons for OS print dialog and silent print via native host.

let payload = null; // { html, labelType, page, targetPrinterId, mode }

const els = {
  frame: document.getElementById("labelFrame"),
  mode: document.getElementById("mode"),
  labelType: document.getElementById("labelType"),
  printer: document.getElementById("printer"),
  size: document.getElementById("size"),
  btnPrintDialog: document.getElementById("btnPrintDialog"),
  btnPrintSilent: document.getElementById("btnPrintSilent"),
  btnClose: document.getElementById("btnClose"),
};

// --- Utilities --------------------------------------------------------------

const PX_PER_MM = 3.78; // ~96 DPI approximation for on-screen preview

function mmToPx(mm) {
  if (!Number.isFinite(mm)) return null;
  return Math.max(100, Math.round(mm * PX_PER_MM)); // clamp to keep visible
}

function setModeBadge(mode) {
  const isSilent = mode === "silent";
  els.mode.textContent = `Mode: ${isSilent ? "Silent" : "Preview"}`;
  els.mode.style.color = isSilent ? "#d35400" : "#2ecc71";
}

function setMeta({ labelType, page, targetPrinterId, mode }) {
  setModeBadge(mode);
  els.labelType.textContent = `Label: ${labelType || "—"}`;
  els.printer.textContent = `Printer: ${targetPrinterId || "—"}`;
  const w = page?.width_mm, h = page?.height_mm;
  els.size.textContent = `Size: ${w ?? "?"} mm × ${h ?? "?"} mm`;
}

function updateIframeSize(page) {
  // Try to make the iframe roughly match the physical label size on screen
  const wPx = mmToPx(page?.width_mm);
  const hPx = mmToPx(page?.height_mm);
  if (wPx) els.frame.style.width = (wPx + 40) + "px";   // small padding for borders
  if (hPx) els.frame.style.height = (hPx + 80) + "px";  // extra for toolbars/headers
}

// --- Payload handling -------------------------------------------------------

window.addEventListener(
  "message",
  (ev) => {
    if (!ev?.data || ev.data.type !== "LABEL_PREVIEW_PAYLOAD") return;
    payload = ev.data.payload;
    render();
  },
  { once: true }
);

// If opened directly without payload, show a friendly hint
setTimeout(() => {
  if (!payload) {
    setModeBadge("preview");
    els.labelType.textContent = "Label: —";
    els.printer.textContent = "Printer: —";
    els.size.textContent = "Size: —";
  }
}, 300);

// --- Render into iframe -----------------------------------------------------

function render() {
  if (!payload) return;
  const { html, labelType, page, targetPrinterId, mode } = payload;

  // Header/meta
  setMeta({ labelType, page, targetPrinterId, mode });

  // Show/hide silent button based on mode
  els.btnPrintSilent.hidden = mode !== "silent";

  // Size the iframe to approximate the label size on screen
  updateIframeSize(page);

  // Inject HTML into iframe, but REMOVE any auto window.print() to avoid OS dialog
  const safeHtml = String(html).replace(/window\.print\(\)/g, "/* preview: no auto print */");

  // Write to iframe
  const frameWin = els.frame.contentWindow;
  if (!frameWin) {
    alert("Preview frame not available. Please allow pop-ups for this site.");
    return;
  }
  const doc = frameWin.document;
  doc.open();
  doc.write(safeHtml);
  doc.close();
}

// --- Buttons ---------------------------------------------------------------

// OS print dialog: print the iframe content
els.btnPrintDialog.addEventListener("click", () => {
  const w = els.frame?.contentWindow;
  if (!w) {
    alert("Preview not ready. Try again.");
    return;
  }
  try {
    w.focus();
    w.print();
  } catch (e) {
    alert("Unable to open system print dialog: " + (e?.message || e));
  }
});

// Silent print via native host (HTML -> background -> native agent -> printer)
els.btnPrintSilent.addEventListener("click", async () => {
  if (!payload) return;
  try {
    const ok = await sendToNativeSilent(payload);
    if (!ok) throw new Error("Silent print failed.");
    window.close();
  } catch (e) {
    alert(e?.message || String(e));
  }
});

// Close preview window
els.btnClose.addEventListener("click", () => window.close());

// --- Messaging to background/service worker --------------------------------

// Uses the background service worker to reach the native host
function sendToNativeSilent({ html, labelType, page, targetPrinterId }) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "PREVIEW_SILENT_PRINT", payload: { html, labelType, page, targetPrinterId } },
      (res) => resolve(!!res?.ok)
    );
  });
}
