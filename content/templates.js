// content/templates.js
// Renders label HTML strings for printing.
// - Uses per-label builders
// - Applies page size class and inner margin from popup/page specs

import { generateBarcodeSVG } from "./barcode.js";
import { pageClassFor } from "./specs.js";

// ---------- utils ----------
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

// Inject per-job inner padding (we keep @page margin:0 in CSS for printer control)
function pageStyleTag(margin_in) {
  return `<style>.label{padding:${margin_in}in !important;}</style>`;
}

// Common wrapper (title + auto-print)
function wrapDoc({ title, pageClass, innerMarginStyle, body }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="${chrome.runtime.getURL("styles/print.css")}">
  ${innerMarginStyle || ""}
</head>
<body>
${body}
<script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;
}

// ---------- builders ----------
const builders = {
  /**
   * LABEL 1 — Work Order Routing (Large 4×6)
   * Expected data: fields = { workOrder, customer, partNo, partRev, qtyOrdered }, operations = [{op, description, resource}]
   */
  label_1({ fields, operations = [] }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const { workOrder, customer, partNo, partRev, qtyOrdered } = fields || {};
    const barcode = barcodeOn ? generateBarcodeSVG(workOrder || "") : "";

    const opsRows = operations
      .map(
        (o) => `
      <tr>
        <td>${esc(o.op)}</td>
        <td>${esc(o.description)}</td>
        <td>${esc(o.resource)}</td>
      </tr>`
      )
      .join("");

    const body = `
<section class="label ${pageClass}">
  <header class="header" style="display:flex;justify-content:space-between;gap:12px;">
    <div class="left">
      <h1 style="margin:0 0 6px 0;font-size:16pt;">WORK ORDER ROUTING</h1>
      <div><strong>WO:</strong> ${esc(workOrder)}</div>
      <div><strong>Customer:</strong> ${esc(customer)}</div>
      <div><strong>Part:</strong> ${esc(partNo)} &nbsp; <strong>Rev:</strong> ${esc(partRev)}</div>
      <div><strong>Qty Ordered:</strong> ${esc(qtyOrdered)}</div>
    </div>
    <div class="right barcode" style="display:flex;align-items:flex-start">${barcode}</div>
  </header>

  <table class="ops" style="width:100%;border-collapse:collapse;margin-top:10px;font-size:10pt;">
    <thead>
      <tr>
        <th style="border:1px solid #000;padding:4px 6px;">Op #</th>
        <th style="border:1px solid #000;padding:4px 6px;">Description</th>
        <th style="border:1px solid #000;padding:4px 6px;">Resource</th>
      </tr>
    </thead>
    <tbody>
      ${opsRows}
    </tbody>
  </table>

  <footer class="sign" style="margin-top:10px;font-size:10pt;">
    <div>Planner: ____________________   Date: _____________</div>
    <div>QA: ________  Production: ________  Ship: ________</div>
  </footer>
</section>`;

    return wrapDoc({
      title: "Work Order Routing — Large",
      pageClass,
      innerMarginStyle,
      body,
    });
  },

  /**
   * LABEL 2 — Small (62×100 mm)
   * Shell layout: top header + key/value stack (easy to customize once fields are final)
   */
  label_2({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const kv = Object.entries(fields)
      .map(([k, v]) => `<div><strong>${esc(humanize(k))}:</strong> ${esc(v)}</div>`)
      .join("");
    const firstVal = Object.values(fields)[0] || "";
    const barcode = barcodeOn ? generateBarcodeSVG(firstVal) : "";

    const body = `
<section class="label ${pageClass}">
  <h1 style="margin:0 0 6px 0;font-size:13pt;">Label 2</h1>
  ${kv}
  <div class="barcode" style="margin-top:8px;">${barcode}</div>
</section>`;

    return wrapDoc({ title: "Label 2", pageClass, innerMarginStyle, body });
  },

  /**
   * LABEL 3 — Small (62×100 mm)
   */
  label_3({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const kv = Object.entries(fields)
      .map(([k, v]) => `<div><strong>${esc(humanize(k))}:</strong> ${esc(v)}</div>`)
      .join("");
    const firstVal = Object.values(fields)[0] || "";
    const barcode = barcodeOn ? generateBarcodeSVG(firstVal) : "";

    const body = `
<section class="label ${pageClass}">
  <h1 style="margin:0 0 6px 0;font-size:13pt;">Label 3</h1>
  ${kv}
  <div class="barcode" style="margin-top:8px;">${barcode}</div>
</section>`;

    return wrapDoc({ title: "Label 3", pageClass, innerMarginStyle, body });
  },

  /**
   * LABEL 4 — BOM TAG #4 (Large 4×6)
   * Layout mirrors the screenshot you shared: stacked blocks with bold captions.
   * Expected fields: { poNumber, vendor, partSpec, qty, units, costPer, completeForRev, rack, workOrder }
   */
  label_4({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const { poNumber, vendor, partSpec, qty, units, costPer, completeForRev, rack, workOrder } = fields;

    const body = `
<section class="label ${pageClass}">
  <h1 style="text-align:center; font-size:14pt; margin:0 0 6px;">MATERIAL FOR<br>OPEN WORK ORDER</h1>

  <div style="margin-top:4px;"><strong>PO #:</strong> ${esc(poNumber)}</div>
  <div style="margin-top:4px;"><strong>VENDOR:</strong><br>${esc(vendor)}</div>
  <div style="margin-top:4px;"><strong>PART #</strong><br>${esc(partSpec)}</div>
  <div style="margin-top:4px;"><strong>QTY:</strong> ${esc(qty)} &nbsp; <strong>UNITS</strong>: ${esc(units)}</div>
  <div style="margin-top:4px;"><strong>COST / PER:</strong> ${esc(costPer)}</div>
  <div style="margin-top:4px;"><strong>Complete for Rev:</strong> ${esc(completeForRev)}</div>
  <div style="margin-top:4px;"><strong>RACK #</strong> ${esc(rack)}</div>
  <div style="margin-top:6px;"><strong>WORK ORDER:</strong><br><span style="font-size:16pt">${esc(workOrder)}</span></div>
</section>`;

    return wrapDoc({ title: "BOM TAG #4", pageClass, innerMarginStyle, body });
  },

  /**
   * LABEL 5 — Small (62×100 mm)
   */
  label_5({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const kv = Object.entries(fields)
      .map(([k, v]) => `<div><strong>${esc(humanize(k))}:</strong> ${esc(v)}</div>`)
      .join("");
    const firstVal = Object.values(fields)[0] || "";
    const barcode = barcodeOn ? generateBarcodeSVG(firstVal) : "";

    const body = `
<section class="label ${pageClass}">
  <h1 style="margin:0 0 6px 0;font-size:13pt;">Label 5</h1>
  ${kv}
  <div class="barcode" style="margin-top:8px;">${barcode}</div>
</section>`;

    return wrapDoc({ title: "Label 5", pageClass, innerMarginStyle, body });
  },

  /**
   * LABEL 6 — Small (62×100 mm)
   */
  label_6({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
    const kv = Object.entries(fields)
      .map(([k, v]) => `<div><strong>${esc(humanize(k))}:</strong> ${esc(v)}</div>`)
      .join("");
    const firstVal = Object.values(fields)[0] || "";
    const barcode = barcodeOn ? generateBarcodeSVG(firstVal) : "";

    const body = `
<section class="label ${pageClass}">
  <h1 style="margin:0 0 6px 0;font-size:13pt;">Label 6</h1>
  ${kv}
  <div class="barcode" style="margin-top:8px;">${barcode}</div>
</section>`;

    return wrapDoc({ title: "Label 6", pageClass, innerMarginStyle, body });
  },
};

// Fallback for any future label until its template is finalized
function basicLabel({ fields = {} }, { barcodeOn }, { pageClass, innerMarginStyle }) {
  const firstVal = Object.values(fields)[0] || "";
  const barcode = barcodeOn ? generateBarcodeSVG(firstVal) : "";
  const body = `
<section class="label ${pageClass}">
  <h1 style="margin:0 0 6px 0;font-size:13pt;">Label</h1>
  <pre style="white-space:pre-wrap;font-size:10pt;margin:0;">${esc(JSON.stringify(fields, null, 2))}</pre>
  <div class="barcode" style="margin-top:8px;">${barcode}</div>
</section>`;
  return wrapDoc({ title: "Label", pageClass, innerMarginStyle, body });
}

// Pretty label for keys (e.g., partNo -> Part No)
function humanize(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

// ---------- exported API ----------
export async function buildLabelHTML(labelType, data, options = {}, pageSpec = {}) {
  const builder = builders[labelType] || basicLabel;
  const pageClass = pageClassFor(labelType); // maps to .page-4x6 or .page-62x100
  const innerMarginStyle = pageStyleTag(pageSpec?.margin_in ?? 0.16);
  return builder(data, options, { pageClass, innerMarginStyle });
}
