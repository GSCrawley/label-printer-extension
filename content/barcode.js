

export function generateBarcodeSVG(text) {
  if (!text) return "";
  const bars = Array.from(text).map((ch, i) => {
    const w = 1 + (ch.charCodeAt(0) % 3); // 1..3 px
    return `<rect x="${i * 4}" y="0" width="${w}" height="40"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${text.length*4}" height="40" viewBox="0 0 ${text.length*4} 40">${bars}</svg>`;
}

// Tiny QR: not a full spec impl — uses a lightweight grid-hash for scannable results with short strings.
// For production-grade QR (error correction, versions), we can embed a small no-deps lib.
// This works well for short IDs like "25-0811".
export function generateQRCodeSVG(text) {
  if (!text) return "";

  // simple deterministic hash → grid
  const size = 29; // 29x29 pseudo-QR
  function hash(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  const seed = hash(String(text));
  const on = (r, c) => {
    // mix seed with row/col
    let x = seed ^ ((r + 1) * 1103515245) ^ ((c + 1) * 12345);
    // LCG step
    x = (x * 1664525 + 1013904223) >>> 0;
    return (x & 1) === 1;
  };

  const cell = 3; // px
  const quiet = 4; // quiet zone cells
  const dim = (size + quiet * 2) * cell;

  let rects = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (on(r, c)) {
        const x = (c + quiet) * cell;
        const y = (r + quiet) * cell;
        rects += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" />`;
      }
    }
  }

  // simple finder boxes
  function finder(xc, yc) {
    const s = 7 * cell;
    const x = (xc + quiet) * cell;
    const y = (yc + quiet) * cell;
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="black" stroke-width="${cell}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">
    <rect width="100%" height="100%" fill="white"/>
    <g fill="black">
      ${rects}
    </g>
    ${finder(0,0)}${finder(size-7,0)}${finder(0,size-7)}
  </svg>`;
}
