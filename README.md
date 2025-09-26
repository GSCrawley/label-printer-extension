# label-printer-extension

# Chrome Extension Development Guide - Label Printing System

## Phase 1: Pre-Meeting Preparation (Do This Before Going On-Site)

### 1.1 Set Up Development Environment
1. Install a code editor (VS Code recommended - free from code.visualstudio.com)
2. Enable Chrome Developer Mode:
   - Open Chrome → Settings → Extensions
   - Toggle "Developer mode" in top right
3. Create a project folder on your desktop: `label-printer-extension`

### 1.2 Research Questions to Ask Ed
- What web-based shop software does he use? (Shopify, WooCommerce, custom system?)
- What are the 6 different label types? (shipping, product, NCR, BOM tag, etc.)
- What label printer model/size requirements?
- Where on the web interface should the extension appear?

## Phase 2: Initial Setup (First 30 Minutes On-Site)

### 2.1 Create Basic Extension Structure
Create these files in your project folder:

**manifest.json** (The extension's configuration file):
```json
{
  "manifest_version": 3,
  "name": "Label Printer Pro",
  "version": "1.0",
  "description": "Print labels directly from shop software",
  "permissions": ["activeTab", "storage"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["styles.css"]
  }],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Print Labels"
  }
}
```

**popup.html** (The extension's interface):
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h3>Label Printer</h3>
    <div class="label-buttons">
      <button id="label1" class="label-btn">Shipping Label</button>
      <button id="label2" class="label-btn">Product Label</button>
      <button id="label3" class="label-btn">Price Label</button>
  <button id="label4" class="label-btn">(Former Barcode) Repurpose Label</button>
      <button id="label5" class="label-btn">Return Label</button>
      <button id="label6" class="label-btn">Custom Label</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### 2.2 Load Extension for Testing
1. Open Chrome → Extensions → "Load unpacked"
2. Select your project folder
3. Extension icon should appear in toolbar

## Phase 3: Core Development (Main Work Session)

### 3.1 Understand Ed's Web Software
1. Have Ed show you the shop software interface
2. Identify where data is displayed (product names, prices, addresses)
3. Use Chrome DevTools (F12) to inspect HTML elements:
   - Right-click on data → "Inspect"
   - Note the HTML selectors (class names, IDs)
   - Document how to extract: customer info, product details, order numbers

### 3.2 Create Data Extraction Functions
**content.js** (Runs on the web page):
```javascript
// This will be customized based on Ed's specific software
function extractShippingInfo() {
  // Example - adapt to actual HTML structure
  return {
    name: document.querySelector('.customer-name')?.textContent,
    address: document.querySelector('.shipping-address')?.textContent,
    city: document.querySelector('.city')?.textContent,
    zip: document.querySelector('.zip')?.textContent
  };
}

function extractProductInfo() {
  return {
    name: document.querySelector('.product-title')?.textContent,
    sku: document.querySelector('.product-sku')?.textContent,
    price: document.querySelector('.price')?.textContent
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = {
      shipping: extractShippingInfo(),
      product: extractProductInfo()
    };
    sendResponse(data);
  }
});
```

### 3.3 Create Label Templates
**popup.js** (Handles button clicks):
```javascript
document.addEventListener('DOMContentLoaded', function() {
  
  // Add click handlers for each label type
  document.getElementById('label1').addEventListener('click', () => printLabel('shipping'));
  document.getElementById('label2').addEventListener('click', () => printLabel('product'));
  // ... repeat for other labels
  
  function printLabel(labelType) {
    // Get data from the current page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'extractData'}, function(data) {
        generateLabel(labelType, data);
      });
    });
  }
  
  function generateLabel(type, data) {
    let labelHTML = '';
    
    switch(type) {
      case 'shipping':
        labelHTML = createShippingLabel(data.shipping);
        break;
      case 'product':
        labelHTML = createProductLabel(data.product);
        break;
      // Add other cases
    }
    
    printHTML(labelHTML);
  }
  
  function createShippingLabel(shippingData) {
    return `
      <div class="shipping-label">
        <h2>SHIPPING LABEL</h2>
        <div class="to-section">
          <strong>TO:</strong><br>
          ${shippingData.name}<br>
          ${shippingData.address}<br>
          ${shippingData.city} ${shippingData.zip}
        </div>
      </div>
    `;
  }
  
  function printHTML(html) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial; }
            .shipping-label { padding: 20px; border: 2px solid black; }
            @media print { 
              body { margin: 0; }
              .shipping-label { border: none; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
});
```

## Phase 4: Customization & Testing (Iterative Process)

### 4.1 Test Each Label Type
1. Navigate to different pages in Ed's shop software
2. Click each label button
3. Verify correct data is extracted
4. Adjust selectors in content.js if data isn't found
5. Fine-tune label formatting

### 4.2 Common Troubleshooting
- **No data extracted**: Check CSS selectors in DevTools
- **Print dialog doesn't appear**: Check popup blocker settings  
- **Wrong formatting**: Adjust CSS in the print styles
- **Extension not loading**: Check manifest.json syntax

## Phase 5: Education & Handoff

### 5.1 Teach Ed the Basics
1. **File Structure**: Show him each file's purpose
2. **Making Changes**: 
   - Edit label templates in popup.js
   - Modify styles in the printHTML function
   - Add new label types by copying existing patterns

### 5.2 Adding New Labels
```javascript
// In popup.html, add new button:
<button id="label7" class="label-btn">New Label Type</button>

// In popup.js, add event listener:
document.getElementById('label7').addEventListener('click', () => printLabel('newtype'));

// Add new case in generateLabel function:
case 'newtype':
  labelHTML = createNewTypeLabel(data);
  break;

// Create new label function:
function createNewTypeLabel(data) {
  return `<div class="new-label">Custom content here</div>`;
}
```

### 5.3 Maintenance Tasks
- **Updating extension**: Increment version in manifest.json, reload in Chrome
- **If website changes**: Update CSS selectors in content.js
- **Backup**: Keep copies of working versions

## Phase 6: Deployment & Distribution

### 6.1 Package for Employees
1. Zip the entire project folder
2. Share installation instructions:
   - Extract zip file
   - Chrome → Extensions → Load unpacked
   - Select extracted folder

### 6.2 Future Improvements
- Add label size options
- Save frequently used addresses
- Batch printing capabilities
- Integration with specific printers

## Key Success Strategies

1. **Start Simple**: Get one label type working perfectly first
2. **Test Frequently**: After each change, test the extension
3. **Document Everything**: Note which selectors work for which data
4. **Be Flexible**: Ed's software might require unique approaches
5. **Plan for Changes**: Web software updates may break selectors

## Emergency Backup Plan
If the live extraction proves challenging, create a manual input form where employees can type in the label information. This ensures the project succeeds even if automatic data extraction needs refinement.

## Developer Utilities

### Selector Extraction Helper (Experimental)
A helper script exists at `dev/helpers/extract_selectors.js` to speed up creating/maintaining selector JSON files.

Use it when you have a Work Order page (live or saved) open and need to draft `content/selectors/<label>.json`.

Steps:
1. (Recommended) Serve the project so relative CSS works (some pages look huge when opened directly). From project root run:
   - Python: `python3 -m http.server 5500`
   - Open: `http://localhost:5500/Label%20Data/Label_1/25-0802_%20Work%20Order%20Navigation.html`
2. Open Chrome DevTools Console on the page.
3. Load the helper:
   ```js
   fetch(chrome.runtime.getURL('dev/helpers/extract_selectors.js')).then(r=>r.text()).then(eval)
   ```
   If not loaded via extension context (e.g., just a local file), you can copy/paste the file contents directly.
4. Run:
   ```js
   extractSelectors({ guessFields: true })
   ```
5. Inspect the logged object:
   - `topSamples`: Highest scoring text nodes and their generated CSS paths.
   - `guessFields`: Grouped candidate selectors keyed from inferred labels.
6. Copy the JSON, prune irrelevant entries, rename keys to canonical field names (`workOrder`, `partNo`, etc.), and place into a new or existing selectors file under `content/selectors/`.
7. Add manual fallbacks (shorter, resilient selectors) and explicit `label` values when you rely on label-based scraping.

Caveats:
- Generated deep `> tag:nth-of-type()` chains are brittle; replace with stable IDs/classes if present.
- Always keep selectors as an ordered array: earlier entries = preferred, later = fallback.
- Remove any sensitive or unique transient values before committing.

### Improving Selector Robustness
- Prefer attribute starts-with selectors for dynamic IDs: `[id^="horizontalMainAtts_partNumber_value"]`
- Combine with data attributes if available.
- Provide both a structural path and a label-based fallback via the JSON `label` key so scraper can fallback to text-near-label if direct selector fails.

### Test plan (in order)
Load the extension

Go to chrome://extensions → Load unpacked → select your repo folder.

Confirm:

Badge shows P (green) for Preview mode.

background.js is listed as the service worker.

preview/preview.html and preview/preview.js are in web_accessible_resources in your manifest.

Mode toggle + badge + shortcut

Open the popup:

Flip the Preview/Silent toggle; confirm the label (“Preview mode”/“Silent mode”) changes and persists.

Close popup; press Ctrl+Shift+P (Mac: ⌘⇧P). Open popup again → mode should have flipped.

Badge should change: P (green) ↔ S (orange).

Keep the popup open and press the shortcut → mode text and toggle should live-update (thanks to the storage listener you added).

Label preview UI (always opens)
 For each label (1–6):

Select the label in the popup.

For small labels (2/3/5/6), choose a Brother (1/2/3). For large labels (1/4), Brother buttons are hidden.

Click the popup’s print button → a Preview window opens (no OS dialog).

In the preview header:

Mode shows Preview or Silent (based on toggle).

“Label: …” matches your selection.

“Size: … mm” reflects the correct spec (4×6 → 101.6×152.4, DK-1202 → 62×100).

“Printer: …” shows zebra_4x6 for large labels, or the Brother you chose for small.

Preview page buttons

System Print…: should print the iframe’s content (expect OS print dialog).

Print:

In Preview mode, this button is hidden (by design).

In Silent mode, it’s visible and will call the native host.

If your native host isn’t installed yet, you’ll get a friendly alert (“Silent print failed”). That’s expected for this phase.

Large→Small guard rail (the “are you sure?” case)

Select a small label (e.g., Label 2), pick Brother #1, open preview (works).

Without closing popup, switch to a large label (Label 1 or 4).

Click the popup button:

You should see the confirmation: “This label is 4×6 and the selected printer is 62×100 mm…”

Cancel → Preview opens targeting Zebra at 4×6.

OK → Preview opens targeting the Brother with 62×100 sizing (margin 0.16″).


Selectors sanity check


Navigate to the target ProShop page(s):


Label 1: Work Order Routing page.


Label 2: Work Order Navigation (small).


Label 3: click path into Non-Conformance Report (the label_3.json has clickByText:"Non-Conformance Report").


Label 4: your multi-page path you already wired.


Label 6: Work Order Navigation (stub fields).


Use the popup to open the preview; verify the fields on each label match the page content (WO #, Customer, Part #/Rev, etc.).


If a field is blank, it’s almost always a selector/caption mismatch. Quick fix: edit the "label" text in the corresponding content/selectors/label_X.json to match what you see on screen (case/spacing agnostic), or add a more specific CSS selector to that field’s "selectors" array. No JS changes needed—save, reload extension, retest.


Layout, sizes, margins


In the preview, visually check:


Label 1/4 (4×6) respect 0.375″ inner padding (look at the whitespace border).


Label 2/3/5/6 (62×100 mm) respect 0.16″ inner padding.


Click System Print… → in Chrome’s print preview, verify paper size shows 4×6 in or 62×100 mm (or set custom if needed during this test phase).


Silent print path (when you’re ready)


Install/run the native host on the test machine.


Switch to Silent mode, open preview, click Print:


Expect the background to forward to the native host (PREVIEW_SILENT_PRINT handler).


If you’re using Azure/UP, confirm the job lands in the intake/target queue and routes by size (or by selected Brother).


Common gotchas (and quick fixes)
Popup or preview blocked: allow pop-ups for your domain (you need new windows for the preview UI).


Content script not running: confirm the matches: in manifest.json covers the actual ProShop URLs; widen temporarily (e.g., https://*/*) while testing.


Badge not updating: ensure the storage listener is present in background.js and that you’re using chrome.storage.sync for printMode.


Label opens but wrong data: tweak the JSON selectors/labels; keep 2–3 CSS fallbacks and a "label" caption for each field.



