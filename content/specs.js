export const LABEL_SPECS = {
  // Large 4×6 (Zebra)
  label_1: { sizeKey: "4x6",  width_mm: 101.6, height_mm: 152.4, margin_in: 0.375, orientation: "portrait" },
  label_4:                   { sizeKey: "4x6",  width_mm: 101.6, height_mm: 152.4, margin_in: 0.375, orientation: "portrait" },

  // Small 62×100 mm (Brother DK-1202)
  label_2: { sizeKey: "62x100", width_mm: 62, height_mm: 100, margin_in: 0.16, orientation: "portrait" },
  label_3: { sizeKey: "62x100", width_mm: 62, height_mm: 100, margin_in: 0.16, orientation: "portrait" },
  label_5: { sizeKey: "62x100", width_mm: 62, height_mm: 100, margin_in: 0.16, orientation: "portrait" },
  label_6: { sizeKey: "62x100", width_mm: 62, height_mm: 100, margin_in: 0.16, orientation: "portrait" }
};

export const PRINTERS = {
  // Logical IDs — your native agent / Azure routing maps these IDs to real queues.
  zebra_4x6:   { id: "zebra_4x6",   label: "Zebra (4×6, Shipping Area)", sizeKey: "4x6" },
  bro_1:       { id: "bro_1",       label: "Brother #1 (62×100)",        sizeKey: "62x100" },
  bro_2:       { id: "bro_2",       label: "Brother #2 (62×100)",        sizeKey: "62x100" },
  bro_3:       { id: "bro_3",       label: "Brother #3 (62×100)",        sizeKey: "62x100" }
};

// helper
export const isLargeLabel = (labelType) => (LABEL_SPECS[labelType]?.sizeKey === "4x6");

// CSS page class for layout
export function pageClassFor(labelType) {
  const spec = LABEL_SPECS[labelType];
  if (!spec) return "page-62x100";
  return spec.sizeKey === "4x6" ? "page-4x6" : "page-62x100";
}
