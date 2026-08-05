import { jsPDF } from "jspdf";

type Veh = {
  year: number | null; make: string | null; model: string | null; trim: string | null;
  vin: string | null; stock: string; mileage: number; priceCents: number;
  exteriorColor: string | null; bodyType: string | null; category: string | null;
  attributes: Record<string, unknown>;
};
type Business = { name: string; brandColor: string | null; logoUrl: string | null; contact: string };

const hexRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return [13, 17, 23];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const attr = (a: Record<string, unknown>, k: string) => { const v = a[k]; return v == null || v === "" || v === false ? "" : typeof v === "boolean" ? "Yes" : String(v); };

/** A clean, print-ready window sticker + Buyer's Guide notice for one unit. */
export function buildStickerPdf(v: Veh, business: Business): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, M = 40, CW = W - M * 2;
  const ink: [number, number, number] = [22, 30, 44];
  const soft: [number, number, number] = [120, 130, 144];
  const accent = hexRgb(business.brandColor || "#0d1117");

  // ── letterhead ──
  const logo = business.logoUrl && business.logoUrl.startsWith("data:image") ? business.logoUrl : null;
  if (logo) {
    try { const p = doc.getImageProperties(logo); const h = 30, w = (p.width / p.height) * h; doc.addImage(logo, "PNG", M, 36, Math.min(w, 170), h); } catch { doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...ink).text(business.name, M, 54); }
  } else {
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...ink).text(business.name, M, 54);
  }
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...soft).text(business.contact || "", M, 70);

  // ── title bar ──
  const title = [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
  let y = 88;
  doc.setFillColor(...accent).rect(M, y, CW, 46, "F");
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(255, 255, 255).text(title, M + 16, y + 22);
  if (v.trim) doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(255, 255, 255).text(v.trim, M + 16, y + 38);
  y += 46;

  // ── price band ──
  doc.setDrawColor(...accent).setLineWidth(1.2).rect(M, y, CW, 40);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...soft).text("OUR PRICE", M + 16, y + 17);
  doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(...ink).text(`$${Math.round(v.priceCents / 100).toLocaleString()}`, W - M - 16, y + 30, { align: "right" });
  y += 58;

  // ── specs (two columns) ──
  const a = v.attributes || {};
  const specRows: [string, string][] = [
    ["VIN", v.vin || "—"],
    ["Stock #", v.stock || "—"],
    ["Mileage", v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"],
    ["Exterior", v.exteriorColor || attr(a, "exteriorColor") || "—"],
    ["Interior", attr(a, "interiorColor") || "—"],
    ["Body", v.bodyType || attr(a, "bodyStyle") || "—"],
    ["Drivetrain", attr(a, "drivetrain") || "—"],
    ["Transmission", attr(a, "transmission") || "—"],
    ["Fuel", attr(a, "fuelType") || "—"],
    ["Engine", attr(a, "engine") || "—"],
  ];
  const specs = specRows.filter(([label, val]) => ["VIN", "Stock #", "Mileage"].includes(label) || (val && val !== "—"));

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ink).text("Specifications", M, y);
  y += 8;
  doc.setDrawColor(230, 232, 236).setLineWidth(0.6).line(M, y, W - M, y);
  y += 16;
  const colX = [M, M + CW / 2 + 8];
  const rowH = 20;
  specs.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const rx = colX[col], ry = y + row * rowH;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...soft).text(s[0].toUpperCase(), rx, ry);
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...ink).text(s[1], rx + 78, ry);
  });
  y += Math.ceil(specs.length / 2) * rowH + 14;

  // ── features / options ──
  const specKeys = new Set(["exteriorColor", "interiorColor", "bodyStyle", "drivetrain", "transmission", "fuelType", "engine"]);
  const features = Object.entries(a).filter(([k, val]) => !specKeys.has(k) && val && val !== false).map(([k, val]) => (val === true ? cap(k.replace(/([A-Z])/g, " $1").trim()) : `${cap(k.replace(/([A-Z])/g, " $1").trim())}: ${val}`));
  if (features.length) {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ink).text("Features & options", M, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...ink);
    const wrapped = doc.splitTextToSize(features.join("   •   "), CW);
    doc.text(wrapped, M, y);
    y += wrapped.length * 12 + 12;
  }

  // ── FTC Buyer's Guide notice ──
  y = Math.max(y, 560);
  doc.setFillColor(245, 246, 248).rect(M, y, CW, 150, "F");
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...ink).text("BUYERS GUIDE", M + 14, y + 22);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...ink);
  const boxY = y + 36;
  doc.setDrawColor(...ink).setLineWidth(1);
  doc.rect(M + 14, boxY, 11, 11); doc.setFont("helvetica", "bold").setFontSize(10).text("AS IS - NO DEALER WARRANTY", M + 32, boxY + 9);
  doc.rect(M + 14, boxY + 22, 11, 11); doc.text("DEALER WARRANTY", M + 32, boxY + 31);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...soft);
  const guide = "The dealer indicates the warranty coverage above for this vehicle. IMPORTANT: Spoken promises are difficult to enforce. Ask the dealer to put all promises in writing. Keep this form. Under state law, \"implied warranties\" may give you additional rights. Ask to see this vehicle's service record and vehicle history report.";
  doc.text(doc.splitTextToSize(guide, CW - 28), M + 14, boxY + 50);

  return doc;
}
