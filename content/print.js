export async function openPrintWindow(html) {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) throw new Error('Pop-up blocked. Allow pop-ups for this site.');
  win.document.open();
  win.document.write(html);
  win.document.close();
}
