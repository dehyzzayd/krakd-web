import { jsPDF } from "jspdf";
import { CATALOG, catalogField } from "@/lib/creditApp";

type Party = Record<string, string>;
type Business = { name: string; brandColor: string | null; logoUrl: string | null; contact: string; consentText: string };

const hexRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return [24, 33, 48];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const coKeys = new Set(CATALOG.find((s) => s.coapp)!.fields.map((f) => f.key));
const fmt = (key: string, val: string) => {
  const t = catalogField(key)?.type;
  if (t === "money" && val) return `$${Number(val).toLocaleString()}`;
  if (t === "ssn" && val) return `XXX-XX-${val.slice(-4)}`;
  return val;
};
const sectionTitle = (s: (typeof CATALOG)[number]) => (s.id === "applicant" ? "Applicant information" : s.coapp ? "Co-applicant information" : s.title);

/** A clean, print-style credit-application form (fill-in-the-line fields). */
export function buildCreditPdf(
  app: { applicant: Party; coApplicant: Party | null; createdAt: Date },
  business: Business,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, H = 792, M = 44, CW = W - M * 2, GAP = 16;
  const ink: [number, number, number] = [28, 37, 51];
  const soft: [number, number, number] = [122, 132, 146];
  const accent = hexRgb(business.brandColor || "#1c2533");
  const TOP = 92, BOTTOM = H - 56, ROW_H = 30, ROW_GAP = 11;
  const colW = (CW - GAP * 2) / 3;

  // ── letterhead ──
  const logo = business.logoUrl && business.logoUrl.startsWith("data:image") ? business.logoUrl : null;
  if (logo) {
    try { const p = doc.getImageProperties(logo); const h = 30, w = (p.width / p.height) * h; doc.addImage(logo, "PNG", M, 40, Math.min(w, 170), h); } catch { /* ignore */ }
  } else {
    doc.setFont("times", "bold").setFontSize(17).setTextColor(...ink).text(business.name, M, 56);
  }
  if (business.contact) doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...soft).text(business.contact, M, logo ? 82 : 71);
  doc.setFont("times", "bold").setFontSize(16).setTextColor(...accent).text("Credit Application", W - M, 52, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...soft).text(`Date: ${app.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, W - M, 68, { align: "right" });
  doc.setDrawColor(...accent).setLineWidth(1.4).line(M, 90, W - M, 90);

  let y = TOP + 18, col = 0;
  const pageBreak = (need: number) => { if (y + need > BOTTOM) { doc.addPage(); y = TOP; col = 0; } };
  const newRow = () => { if (col > 0) { col = 0; y += ROW_H + ROW_GAP; } };

  const sectionHeader = (title: string) => {
    newRow();
    pageBreak(30 + ROW_H);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...ink);
    doc.text(title.toUpperCase(), M, y + 2, { charSpace: 0.9 });
    doc.setDrawColor(...accent).setLineWidth(0.8).line(M, y + 8, W - M, y + 8);
    y += 24;
  };

  const entry = (x: number, w: number, label: string, value: string) => {
    doc.setFont("helvetica", "normal").setFontSize(6.6).setTextColor(...soft);
    doc.text(label.toUpperCase(), x, y + 7, { charSpace: 0.4 });
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...ink);
    doc.text((doc.splitTextToSize(value || "—", w) as string[])[0] ?? "—", x, y + 21);
    doc.setDrawColor(206, 211, 219).setLineWidth(0.6).line(x, y + 26, x + w, y + 26);
  };

  const drawField = (label: string, value: string, wide: boolean) => {
    const span = wide ? 3 : 1;
    if (col + span > 3) newRow();
    pageBreak(ROW_H);
    const x = M + col * (colW + GAP);
    entry(x, span === 3 ? CW : colW, label, value);
    col += span;
    if (col >= 3) newRow();
  };

  const renderParty = (data: Party, isCo: boolean) => {
    for (const s of CATALOG) {
      const fields = s.fields.filter((f) => (isCo ? coKeys.has(f.key) : !coKeys.has(f.key)) && String(data[f.key] ?? "").trim());
      if (fields.length === 0) continue;
      sectionHeader(sectionTitle(s));
      for (const f of fields) drawField(f.label, fmt(f.key, data[f.key]), !f.half);
      newRow();
    }
  };

  renderParty(app.applicant, false);
  if (app.coApplicant) renderParty(app.coApplicant, true);

  // ── authorization & signatures ──
  const consent = business.consentText || "";
  const lines = consent ? (doc.setFontSize(8.5).splitTextToSize(consent, CW) as string[]) : [];
  pageBreak(30 + lines.length * 11 + 76);
  sectionHeader("Authorization & signatures");
  if (lines.length) {
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(70, 80, 94);
    doc.text(lines, M, y + 2, { lineHeightFactor: 1.35 });
    y += lines.length * 11.5 + 16;
  }
  const sigRow = (aLabel: string) => {
    doc.setDrawColor(...ink).setLineWidth(0.8);
    doc.line(M, y + 22, M + 300, y + 22);
    doc.line(M + 330, y + 22, W - M, y + 22);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...soft);
    doc.text(aLabel, M, y + 33);
    doc.text("Date", M + 330, y + 33);
    y += 48;
  };
  sigRow("Applicant signature");
  if (app.coApplicant) { pageBreak(48); sigRow("Co-applicant signature"); }

  // ── footer ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 232, 238).setLineWidth(0.5).line(M, H - 44, W - M, H - 44);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(158, 166, 176);
    doc.text(`${business.name}  ·  Confidential`, M, H - 32);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 32, { align: "right" });
  }
  return doc;
}
