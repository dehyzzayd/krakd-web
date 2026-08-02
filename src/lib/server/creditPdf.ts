import { jsPDF } from "jspdf";
import { CATALOG, catalogField } from "@/lib/creditApp";

type Party = Record<string, string>;
type Business = { name: string; brandColor: string | null; logoUrl: string | null; contact: string; consentText: string };

const hexRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return [15, 27, 45];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const STATUS_RGB: Record<string, [number, number, number]> = { NEW: [43, 107, 164], REVIEWING: [192, 133, 50], APPROVED: [31, 138, 101], DECLINED: [178, 59, 91] };
const coKeys = new Set(CATALOG.find((s) => s.coapp)!.fields.map((f) => f.key));
const fmt = (key: string, val: string) => {
  const t = catalogField(key)?.type;
  if (t === "money" && val) return `$${Number(val).toLocaleString()}`;
  if (t === "ssn" && val) return `XXX-XX-${val.slice(-4)}`;
  return val;
};

/** A real, form-style credit-application PDF (original layout). */
export function buildCreditPdf(
  app: { applicant: Party; coApplicant: Party | null; status: string; createdAt: Date },
  business: Business,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, H = 792, M = 40, CW = W - M * 2, GAP = 9;
  const accent = hexRgb(business.brandColor || "#0f1b2d");
  const TOP = 128;              // content start on continuation pages
  const BOTTOM = H - 54;        // keep clear of footer
  const ROW_H = 34, ROW_GAP = 8;
  const colW = (CW - GAP * 2) / 3;

  // ── header (page 1) ──
  const logo = business.logoUrl && business.logoUrl.startsWith("data:image") ? business.logoUrl : null;
  if (logo) {
    try { const p = doc.getImageProperties(logo); const h = 32, w = (p.width / p.height) * h; doc.addImage(logo, "PNG", M, 40, Math.min(w, 180), h); } catch { /* ignore */ }
  }
  if (!logo) { doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(15, 27, 45).text(business.name, M, 58); }
  if (business.contact) { doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(130, 140, 152).text(business.contact, M, logo ? 84 : 72); }
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...accent).text("CREDIT APPLICATION", W - M, 54, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(120, 130, 145).text(`Application date: ${app.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, W - M, 70, { align: "right" });
  // status pill
  const [sr, sg, sb] = STATUS_RGB[app.status] ?? accent;
  const sl = app.status[0] + app.status.slice(1).toLowerCase();
  doc.setFontSize(8).setFont("helvetica", "bold");
  const pw = doc.getTextWidth(sl) + 14;
  doc.setFillColor(sr, sg, sb).roundedRect(W - M - pw, 78, pw, 15, 7.5, 7.5, "F");
  doc.setTextColor(255, 255, 255).text(sl, W - M - pw / 2, 88.5, { align: "center" });
  doc.setDrawColor(...accent).setLineWidth(2).line(M, 104, W - M, 104);

  let y = 122, col = 0;

  const pageBreak = (need: number) => { if (y + need > BOTTOM) { doc.addPage(); y = TOP; col = 0; } };
  const newRow = () => { if (col > 0) { col = 0; y += ROW_H + ROW_GAP; } };

  const sectionBar = (title: string) => {
    newRow();
    pageBreak(24 + ROW_H);
    doc.setFillColor(244, 246, 249).rect(M, y, CW, 18, "F");
    doc.setFillColor(...accent).rect(M, y, 3, 18, "F");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...accent);
    doc.text(title.toUpperCase(), M + 9, y + 12.5);
    y += 26;
  };

  const fieldBox = (x: number, w: number, label: string, value: string) => {
    doc.setDrawColor(225, 229, 235).setLineWidth(0.6).roundedRect(x, y, w, ROW_H, 3, 3, "S");
    doc.setFont("helvetica", "normal").setFontSize(6.8).setTextColor(140, 150, 162);
    doc.text(label.toUpperCase(), x + 7, y + 11);
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(20, 30, 46);
    doc.text(doc.splitTextToSize(value || "—", w - 14)[0] ?? "—", x + 7, y + 25);
  };

  const drawField = (label: string, value: string, wide: boolean) => {
    const span = wide ? 3 : 1;
    if (col + span > 3) newRow();
    pageBreak(ROW_H);
    const x = M + col * (colW + GAP);
    const w = span === 3 ? CW : colW;
    fieldBox(x, w, label, value);
    col += span;
    if (col >= 3) newRow();
  };

  const renderParty = (heading: string, data: Party, isCo: boolean) => {
    for (const s of CATALOG) {
      const fields = s.fields.filter((f) => (isCo ? coKeys.has(f.key) : !coKeys.has(f.key)) && String(data[f.key] ?? "").trim());
      if (fields.length === 0) continue;
      sectionBar(isCo ? `${heading} — ${s.title === "Co-applicant" ? "Details" : s.title}` : s.title);
      for (const f of fields) drawField(f.label, fmt(f.key, data[f.key]), !f.half);
      newRow();
    }
  };

  // applicant heading band
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20, 30, 46).text("Applicant", M, y); y += 12;
  renderParty("Applicant", app.applicant, false);
  if (app.coApplicant) {
    newRow(); y += 4;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20, 30, 46).text("Co-applicant", M, y); y += 12;
    renderParty("Co-applicant", app.coApplicant, true);
  }

  // ── authorization & signature ──
  newRow();
  const consent = business.consentText || "";
  const lines = consent ? doc.setFontSize(8).splitTextToSize(consent, CW) as string[] : [];
  const authNeed = 26 + lines.length * 10 + 70;
  pageBreak(authNeed);
  sectionBar("Authorization & signature");
  if (lines.length) {
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(90, 100, 112);
    doc.text(lines, M, y + 2); y += lines.length * 10 + 12;
  }
  const sigLine = (x: number, w: number, label: string) => {
    doc.setDrawColor(120, 130, 145).setLineWidth(0.8).line(x, y + 20, x + w, y + 20);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(120, 130, 145).text(label, x, y + 31);
  };
  sigLine(M, 300, "Applicant signature");
  sigLine(M + 320, CW - 320, "Date");
  y += 44;
  if (app.coApplicant) { pageBreak(44); sigLine(M, 300, "Co-applicant signature"); sigLine(M + 320, CW - 320, "Date"); }

  // ── footer ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(232, 236, 240).setLineWidth(0.5).line(M, H - 42, W - M, H - 42);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(155, 163, 173);
    doc.text(`${business.name} · Confidential credit application`, M, H - 30);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 30, { align: "right" });
  }
  return doc;
}
