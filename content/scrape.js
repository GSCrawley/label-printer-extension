// Utility: text helpers
const T = s => (s || '').toString().trim();
const text = el => T(el?.textContent);

// Utility: find by label text near a value node
function getTextNearLabel(labelText) {
  const xpath = `//*[normalize-space(text())='${labelText}']/following::*[1]`;
  const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  return text(node);
}

// Utility: generic query helper with fallbacks
function q(selectorList) {
  if (!selectorList) return null;
  for (const sel of selectorList) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

async function loadSelectors(labelType) {
  const url = chrome.runtime.getURL(`content/selectors/${labelType}.json`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Missing selectors for ${labelType}`);
  return res.json();
}

/**
 * Scrape according to selectors JSON:
 * {
 *   "fields": {
 *     "workOrder": { "selectors": ["#woNumber", ".wo-id"], "label":"Work Order #" },
 *     "customer":  { "selectors": [".customer-name"], "label":"Customer" },
 *     "partNo":    { "selectors": [".part-number"], "label":"Part #"},
 *     "partRev":   { "selectors": [".part-rev"], "label":"Part Rev"},
 *     "qtyOrdered":{ "selectors": [".qty-ordered"], "label":"Qty Ordered"}
 *   },
 *   "operations": {
 *     "rowSelector": "table#ops tbody tr",
 *     "cols": {
 *       "op": { "selectors": [".op-num"], "nth": 0 },
 *       "description": { "selectors": [".op-desc"], "nth": 1 },
 *       "resource": { "selectors": [".op-resource"], "nth": 2 }
 *     }
 *   }
 * }
 */
export async function scrapeAll(labelType) {
  const sel = await loadSelectors(labelType);

  // Header fields
  const fields = {};
  for (const [key, spec] of Object.entries(sel.fields || {})) {
    let val = null;

    // prefer direct CSS
    const el = q(spec.selectors);
    if (el) val = text(el);

    // fallback to label-based lookup
    if ((!val || !val.length) && spec.label) {
      val = getTextNearLabel(spec.label);
    }

    fields[key] = T(val);
  }

  // Operations table (if configured)
  const ops = [];
  if (sel.operations?.rowSelector) {
    document.querySelectorAll(sel.operations.rowSelector).forEach(tr => {
      const row = {};
      for (const [colKey, colSpec] of Object.entries(sel.operations.cols || {})) {
        let cellEl = null;

        // direct selector inside tr
        if (colSpec.selectors?.length) {
          for (const s of colSpec.selectors) {
            const cand = tr.querySelector(s);
            if (cand) { cellEl = cand; break; }
          }
        }

        // nth-child fallback
        if (!cellEl && Number.isInteger(colSpec.nth)) {
          cellEl = tr.children[colSpec.nth];
        }

        row[colKey] = text(cellEl);
      }
      // push non-empty rows
      if (Object.values(row).some(v => T(v).length)) ops.push(row);
    });
  }

  return { fields, operations: ops };
}
