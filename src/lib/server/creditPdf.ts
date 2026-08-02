import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CATALOG, catalogField } from "@/lib/creditApp";

type Party = Record<string, string>;
type Business = { name: string; brandColor: string | null; logoUrl: string | null };

const hexRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [15, 27, 45];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const STATUS_RGB: Record<string, [number, number, number]> = { NEW: [43, 107, 164], REVIEWING: [192, 133, 50], APPROVED: [31, 138, 101], DECLINED: [178, 59, 91] };
const coKeys = new Set(CATALOG.find((s) => s.coapp)!.fields.map((f) => f.key));

const fmt = (key: string, val: string) => {
  const t = catalogField(key)?.type;
  if (t === "money" && val) return `$${Number(val).toLocaleString()}`;
  if (t === "ssn" && val) return `•••-••-${val.slice(-4)}`;
  return val;
};

/** Build a polished, real PDF of a credit application (no browser print). */
export function buildCreditPdf(app: { applicant: Party; coApplicant: Party | null; status: string; createdAt: Date }, business: Business): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, M = 48;
  const accent = hexRgb(business.brandColor || "#0f1b2d");

  // ── header ──
  let headerBottom = 96;
  const logo = business.logoUrl && business.logoUrl.startsWith("data:image") ? business.logoUrl : null;
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const h = 34, w = (props.width / props.height) * h;
      doc.addImage(logo, "PNG", M, 44, Math.min(w, 180), h);
    } catch { /* fall back to name */ }
  }
  if (!logo) {
    doc.setFont("helvetica", "bold").setFontSize(17).setTextColor(15, 27, 45);
    doc.text(business.name, M, 66);
  }
  // right block
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...accent);
  doc.text("CREDIT APPLICATION", W - M, 58, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120, 130, 145);
  doc.text(`Submitted ${app.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, W - M, 74, { align: "right" });
  // status pill
  const [sr, sg, sb] = STATUS_RGB[app.status] ?? accent;
  const label = app.status[0] + app.status.slice(1).toLowerCase();
  doc.setFontSize(8.5).setFont("helvetica", "bold");
  const pw = doc.getTextWidth(label) + 16;
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(W - M - pw, 82, pw, 16, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(label, W - M - pw / 2, 93, { align: "center" });
  // accent rule
  doc.setDrawColor(...accent).setLineWidth(2);
  doc.line(M, headerBottom, W - M, headerBottom);

  // ── party sections ──
  let y = headerBottom + 20;
  const renderParty = (title: string, data: Party, isCo: boolean) => {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 27, 45);
    doc.text(title, M, y); y += 6;
    for (const section of CATALOG) {
      const rows = section.fields
        .filter((f) => (isCo ? coKeys.has(f.key) : !coKeys.has(f.key)) && String(data[f.key] ?? "").trim())
        .map((f) => [f.label, fmt(f.key, data[f.key])]);
      if (rows.length === 0) continue;
      // the personal + co-applicant sections would just repeat the party title — skip their header
      const skipHead = section.coapp || section.id === "applicant";
      autoTable(doc, {
        startY: y + 8,
        head: skipHead ? undefined : [[{ content: section.title, colSpan: 2 }]],
        body: rows,
        theme: "plain",
        margin: { left: M, right: M },
        headStyles: { fontSize: 8, fontStyle: "bold", textColor: accent, cellPadding: { top: 6, bottom: 3, left: 0, right: 0 } },
        styles: { fontSize: 9.5, cellPadding: { top: 3.5, bottom: 3.5, left: 0, right: 0 }, lineColor: [235, 238, 242], lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 } },
        columnStyles: { 0: { textColor: [110, 122, 138], cellWidth: 200 }, 1: { textColor: [15, 27, 45], fontStyle: "bold" } },
      });
      // @ts-expect-error autotable augments the doc
      y = doc.lastAutoTable.finalY + 10;
    }
    y += 6;
  };

  renderParty("Applicant", app.applicant, false);
  if (app.coApplicant) renderParty("Co-applicant", app.coApplicant, true);

  // ── footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(235, 238, 242).setLineWidth(0.5).line(M, 762, W - M, 762);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(150, 158, 168);
    doc.text(`${business.name} · Confidential credit application`, M, 774);
    doc.text(`Page ${i} of ${pages}`, W - M, 774, { align: "right" });
  }
  return doc;
}
