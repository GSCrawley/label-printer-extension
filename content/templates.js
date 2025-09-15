import { generateBarcodeSVG } from "./barcode.js"; // optional; can return "" if off

const esc = s => String(s ?? "").replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

// register all label builders here
const builders = {
  work_order_routing_large({ fields, operations }, { barcodeOn }) {
    const { workOrder, customer, partNo, partRev, qtyOrdered } = fields;

    const barcode = barcodeOn ? generateBarcodeSVG(workOrder || "") : "";

    const opsRows = operations.map(o => `
      <tr>
        <td>${esc(o.op)}</td>
        <td>${esc(o.description)}</td>
        <td>${esc(o.resource)}</td>
      </tr>`).join("");

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Order Routing — Large</title>
  <link rel="stylesheet" href="${chrome.runtime.getURL('styles/print.css')}">
</head>
<body>
  <section class="label page-lg">
    <header class="header">
      <div class="left">
        <h1>WORK ORDER ROUTING</h1>
        <div><strong>WO:</strong> ${esc(workOrder)}</div>
        <div><strong>Customer:</strong> ${esc(customer)}</div>
        <div><strong>Part:</strong> ${esc(partNo)} &nbsp; <strong>Rev:</strong> ${esc(partRev)}</div>
        <div><strong>Qty Ordered:</strong> ${esc(qtyOrdered)}</div>
      </div>
      <div class="right barcode">${barcode}</div>
    </header>

    <table class="ops">
      <thead><tr><th>Op #</th><th>Description</th><th>Resource</th></tr></thead>
      <tbody>${opsRows}</tbody>
    </table>

    <footer class="sign">
      <div>Planner: ____________________   Date: _____________</div>
      <div>QA: ________  Production: ________  Ship: ________</div>
    </footer>
  </section>

  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;
  },

  // placeholder builders for other labels; add as templates arrive
  label_2({ fields }, opts) { return basicLabel("Label 2", fields, opts); },
  label_3({ fields }, { barcodeOn }) {
    const { ncrRefNumber, partNo, partName, partDescription, customer, custPoNumber, qty, dispositionedQty, partRev, status, responsibility, type, ncrCode, causeCode, partsAffected, user, assignedTo, ncrDate, notes } = fields;

    const barcode = barcodeOn ? generateBarcodeSVG(ncrRefNumber || "") : "";

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Non-Conformance Report Label</title>
  <link rel="stylesheet" href="${chrome.runtime.getURL('styles/print.css')}">
  <style>
    .label { font-family: Arial, sans-serif; padding: 10px; border: 1px solid #ccc; max-width: 400px; margin: auto; }
    .header { text-align: center; margin-bottom: 10px; }
    .details { display: flex; flex-wrap: wrap; }
    .details div { flex: 1 1 50%; margin-bottom: 5px; }
    .details strong { display: inline-block; min-width: 120px; }
    .notes { margin-top: 10px; font-style: italic; }
    .barcode { text-align: center; margin-top: 10px; }
  </style>
</head>
<body>
  <section class="label page-sm">
    <header class="header">
      <h1>NON-CONFORMANCE REPORT</h1>
      <div class="barcode">${barcode}</div>
    </header>

    <div class="details">
      <div><strong>NCR Ref #:</strong> ${esc(ncrRefNumber)}</div>
      <div><strong>Part #:</strong> ${esc(partNo)}</div>
      <div><strong>Part Name:</strong> ${esc(partName)}</div>
      <div><strong>Part Description:</strong> ${esc(partDescription)}</div>
      <div><strong>Customer:</strong> ${esc(customer)}</div>
      <div><strong>Cust PO#:</strong> ${esc(custPoNumber)}</div>
      <div><strong>Qty:</strong> ${esc(qty)}</div>
      <div><strong>Dispositioned Qty:</strong> ${esc(dispositionedQty)}</div>
      <div><strong>Part Rev:</strong> ${esc(partRev)}</div>
      <div><strong>Status:</strong> ${esc(status)}</div>
      <div><strong>Responsibility:</strong> ${esc(responsibility)}</div>
      <div><strong>Type:</strong> ${esc(type)}</div>
      <div><strong>NCR Code:</strong> ${esc(ncrCode)}</div>
      <div><strong>Cause Code:</strong> ${esc(causeCode)}</div>
      <div><strong>Parts Affected:</strong> ${esc(partsAffected)}</div>
      <div><strong>User:</strong> ${esc(user)}</div>
      <div><strong>Assigned To:</strong> ${esc(assignedTo)}</div>
      <div><strong>NCR Date:</strong> ${esc(ncrDate)}</div>
    </div>

    <div class="notes">
      <strong>Notes:</strong> ${esc(notes)}
    </div>
  </section>

  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;
  },
  label_4({ fields }, opts) { return basicLabel("Label 4", fields, opts); },
  label_5({ fields }, opts) { return basicLabel("Label 5", fields, opts); },
  label_6({ fields }, opts) { return basicLabel("Label 6", fields, opts); }
};

// Alias: allow legacy UI value 'label_1' to map to the large WOR template
builders.label_1 = builders.work_order_routing_large;

function basicLabel(title, fields, { barcodeOn }) {
  const firstKey = Object.keys(fields)[0] || "";
  const barcode = barcodeOn ? generateBarcodeSVG(fields[firstKey] || "") : "";
  return `
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${chrome.runtime.getURL('styles/print.css')}">
<title>${esc(title)}</title></head>
<body>
  <section class="label page-sm">
    <h1>${esc(title)}</h1>
    <pre>${esc(JSON.stringify(fields, null, 2))}</pre>
    <div class="barcode">${barcode}</div>
  </section>
  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body></html>`;
}

export async function buildLabelHTML(labelType, data, options = {}) {
  const fn = builders[labelType];
  if (!fn) throw new Error(`Unknown label type: ${labelType}`);
  return fn(data, options);
}
