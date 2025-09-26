// Templates for labels (barcode feature removed).

const esc = s => String(s ?? "").replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

// register all label builders here
const builders = {
  label_1({ fields, operations }) {
    const { workOrder, customer, partNo, partRev, qtyOrdered } = fields;

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
  label_2({ fields }) { return basicLabel("Label 2", fields); },
  label_3({ fields }) {
    const { ncrRefNumber, partNo, partName, partDescription, customer, custPoNumber, qty, dispositionedQty, partRev, status, responsibility, type, ncrCode, causeCode, partsAffected, user, assignedTo, ncrDate, notes } = fields;

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
  
  </style>
</head>
<body>
  <section class="label page-sm">
    <header class="header">
      <h1>NON-CONFORMANCE REPORT</h1>
  
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
// inside builders in content/templates.js
label_4({ fields }) {
  const { poNumber, vendor, partSpec, qty, units, costPer, completeForRev, rack, workOrder } = fields;
  return `
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${chrome.runtime.getURL('styles/print.css')}">
<title>BOM TAG #4</title></head>
<body>
<section class="label page-sm">
  <h1 style="text-align:center; font-size:14pt; margin:0 0 6px">MATERIAL FOR<br>OPEN WORK ORDER</h1>
  <div><strong>PO #:</strong> ${poNumber}</div>
  <div><strong>VENDOR:</strong><br>${vendor}</div>
  <div><strong>PART #</strong><br>${partSpec}</div>
  <div><strong>QTY:</strong> ${qty} <strong>UNITS</strong>: ${units}</div>
  <div><strong>COST / PER:</strong> ${costPer}</div>
  <div><strong>Complete for Rev:</strong> ${completeForRev}</div>
  <div><strong>RACK #</strong> ${rack}</div>
  <div><strong>WORK ORDER:</strong><br><span style="font-size:16pt">${workOrder}</span></div>
</section>
<script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body></html>`;
},
  label_5({ fields }) { return basicLabel("Label 5", fields); },
  label_6({ fields }) { return basicLabel("Label 6", fields); }
};

// Provide an alias for work_order_routing_large if referenced elsewhere
builders.work_order_routing_large = builders.label_1;

function basicLabel(title, fields) {
  const firstKey = Object.keys(fields)[0] || "";
  return `
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${chrome.runtime.getURL('styles/print.css')}">
<title>${esc(title)}</title></head>
<body>
  <section class="label page-sm">
    <h1>${esc(title)}</h1>
    <pre>${esc(JSON.stringify(fields, null, 2))}</pre>
    
  </section>
  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body></html>`;
}

export async function buildLabelHTML(labelType, data, options = {}) {
  const fn = builders[labelType];
  if (!fn) throw new Error(`Unknown label type: ${labelType}`);
  return fn(data, options);
}
