// For production, consider bundling a tiny Code128 or QR generator.
// For now, return an SVG placeholder if input exists.
export function generateBarcodeSVG(text) {
  if (!text) return "";
  // simple “fake” barcode bars by charcode width (placeholder):
  const bars = Array.from(text).map((ch, i) => {
    const w = 1 + (ch.charCodeAt(0) % 3); // 1..3 px
    return `<rect x="${i * 4}" y="0" width="${w}" height="40"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${text.length*4}" height="40" viewBox="0 0 ${text.length*4} 40">${bars}</svg>`;
}
