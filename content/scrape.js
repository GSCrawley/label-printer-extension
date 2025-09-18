// content/scrape.js

const T = s => (s || "").toString().trim();
const textOf = el => T(el?.textContent);

// ---------- helpers: DOM waits & clicks ----------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForSelector(selector, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(100);
  }
  throw new Error(`Timeout waiting for selector: ${selector}`);
}

async function clickFirstExisting(selectors = [], safetyDelay = 0) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      el.click();
      if (safetyDelay) await sleep(safetyDelay);
      return true;
    }
  }
  return false;
}

// click by *visible* text (contains), case-insensitive
function findByText(text, fuzzy = false) {
  if (!text) return null;
  const needle = text.toLowerCase();
  const tags = ["a","button","summary","div","span","li","td","th"];
  for (const tag of tags) {
    const els = document.getElementsByTagName(tag);
    for (const el of els) {
      const s = el.textContent?.toLowerCase().replace(/\s+/g, " ").trim() || "";
      if ((fuzzy && s.includes(needle)) || s === needle) return el;
    }
  }
  return null;
}

async function clickByText(text, fuzzy = true, timeout = 8000, safetyDelay = 150) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = findByText(text, fuzzy);
    if (el) {
      el.click();
      if (safetyDelay) await sleep(safetyDelay);
      return;
    }
    await sleep(125);
  }
  throw new Error(`Timeout clicking text: ${text}`);
}

// ---------- label-based value fallback ----------
function valueNearLabel(labelText) {
  if (!labelText) return "";
  const xp = `//*[normalize-space(translate(text(),'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ'))='${labelText.toUpperCase()}']/following::*[1]`;
  const node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  return textOf(node);
}

// ---------- selectors loader ----------
async function loadSelectors(labelType) {
  const url = chrome.runtime.getURL(`content/selectors/${labelType}.json`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Missing selectors for ${labelType}`);
  return res.json();
}

// ---------- action runner (multi-page / dropdowns) ----------
async function runActions(actions = []) {
  for (const step of actions) {
    const t = step.type;
    if (t === "waitFor") {
      const sel = step.selector;
      await waitForSelector(sel, step.timeout_ms || 8000);
    } else if (t === "clickIfExists") {
      await clickFirstExisting(step.selectorList || [], step.safetyDelay_ms || 0);
    } else if (t === "clickByText") {
      await clickByText(step.text, !!step.fuzzy, step.timeout_ms || 8000, step.safetyDelay_ms || 150);
    } else if (t === "clickByTextIfExists") {
      const el = findByText(step.text, !!step.fuzzy);
      if (el) { el.click(); if (step.safetyDelay_ms) await sleep(step.safetyDelay_ms); }
    } else if (t === "sleep") {
      await sleep(step.ms || 100);
    } else {
      console.warn("Unknown action:", step);
    }
  }
}

// ---------- table support (unchanged from earlier approach) ----------
function pickFirst(selList = [], root = document) {
  for (const s of selList) {
    const el = root.querySelector(s);
    if (el) return el;
  }
  return null;
}

function cleanWithRegex(val, regex) {
  if (!regex) return val;
  try {
    const m = val.match(new RegExp(regex));
    return m ? (m[1] || m[0]) : val;
  } catch { return val; }
}

export async function scrapeAll(labelType) {
  const spec = await loadSelectors(labelType);

  // 1) do the navigation/expand sequence if provided
  if (Array.isArray(spec.actions) && spec.actions.length) {
    await runActions(spec.actions);
  }

  // 2) now collect fields
  const fields = {};
  for (const [key, f] of Object.entries(spec.fields || {})) {
    let val = "";

    // try CSS list first
    if (Array.isArray(f.selectors) && f.selectors.length) {
      const el = pickFirst(f.selectors);
      if (el) val = textOf(el);
    }

    // fallback to finding value near label text
    if (!val && f.label) {
      val = valueNearLabel(f.label);
    }

    // optional cleanup
    fields[key] = cleanWithRegex(T(val), f.regex);
  }

  // 3) optional operations table support (left as in the prior version)
  const ops = [];
  if (spec.operations?.rowSelector) {
    document.querySelectorAll(spec.operations.rowSelector).forEach(tr => {
      const row = {};
      for (const [colKey, colSpec] of Object.entries(spec.operations.cols || {})) {
        let cellEl = null;
        if (colSpec.selectors?.length) cellEl = pickFirst(colSpec.selectors, tr);
        if (!cellEl && Number.isInteger(colSpec.nth)) cellEl = tr.children[colSpec.nth];
        row[colKey] = textOf(cellEl);
      }
      if (Object.values(row).some(v => T(v))) ops.push(row);
    });
  }

  return { fields, operations: ops };
}
