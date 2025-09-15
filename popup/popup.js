async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.sendMessage(tab.id, message);
}

document.getElementById('printBtn').addEventListener('click', async () => {
  const labelType = document.getElementById('labelType').value;
  const barcodeOn = document.getElementById('barcodeOn').checked;

  document.getElementById('status').textContent = 'Building label…';

  try {
    const res = await sendToActiveTab({
      type: 'PRINT_LABEL',
      payload: { labelType, options: { barcodeOn } }
    });

    document.getElementById('status').textContent = res?.ok
      ? 'Sent to print window.'
      : (res?.error || 'Unable to print on this page.');
  } catch (e) {
    document.getElementById('status').textContent = e.message;
  }
});
