/** ADF (Auto-lead Data Format) generation — the automotive industry's open XML
 *  standard for exchanging leads between systems (CRMs, DMSs, providers). Dealers
 *  forward/import these so Krakd leads flow into their existing tools. */

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type AdfLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  createdAt: Date;
  status: string;
  comments?: string;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null; trim?: string | null; vin?: string | null; stock?: string | null; priceCents?: number | null } | null;
};

const STATUS_MAP: Record<string, string> = { NEW: "new", CONTACTED: "new", QUALIFIED: "working", APPOINTMENT: "working", SOLD: "closed", LOST: "lost" };

function vehicleBlock(v: NonNullable<AdfLead["vehicle"]>): string {
  const rows = [
    v.year ? `      <year>${esc(v.year)}</year>` : "",
    v.make ? `      <make>${esc(v.make)}</make>` : "",
    v.model ? `      <model>${esc(v.model)}</model>` : "",
    v.trim ? `      <trim>${esc(v.trim)}</trim>` : "",
    v.vin ? `      <vin>${esc(v.vin)}</vin>` : "",
    v.stock ? `      <stock>${esc(v.stock)}</stock>` : "",
    v.priceCents ? `      <price type="asking" currency="USD">${Math.round(v.priceCents / 100)}</price>` : "",
  ].filter(Boolean).join("\n");
  return `    <vehicle interest="buy" status="used">\n${rows}\n    </vehicle>`;
}

export function adfProspect(lead: AdfLead, vendorName: string): string {
  const parts: string[] = [];
  parts.push(`  <prospect status="${STATUS_MAP[lead.status] ?? "new"}">`);
  parts.push(`    <requestdate>${lead.createdAt.toISOString()}</requestdate>`);
  if (lead.vehicle && (lead.vehicle.make || lead.vehicle.model || lead.vehicle.year)) parts.push(vehicleBlock(lead.vehicle));
  parts.push(`    <customer>`);
  parts.push(`      <contact>`);
  parts.push(`        <name part="first" type="individual">${esc(lead.firstName)}</name>`);
  if (lead.lastName) parts.push(`        <name part="last" type="individual">${esc(lead.lastName)}</name>`);
  if (lead.email) parts.push(`        <email>${esc(lead.email)}</email>`);
  if (lead.phone) parts.push(`        <phone type="voice" time="nopreference">${esc(lead.phone)}</phone>`);
  parts.push(`      </contact>`);
  if (lead.comments) parts.push(`      <comments>${esc(lead.comments)}</comments>`);
  parts.push(`    </customer>`);
  parts.push(`    <vendor>`);
  parts.push(`      <vendorname>${esc(vendorName)}</vendorname>`);
  parts.push(`      <contact><name part="full">${esc(vendorName)}</name></contact>`);
  parts.push(`    </vendor>`);
  parts.push(`    <provider><name part="full">Krakd</name><service>${esc(lead.source)}</service></provider>`);
  parts.push(`  </prospect>`);
  return parts.join("\n");
}

/** Wrap one or more prospects in a valid ADF document. */
export function buildAdf(leads: AdfLead[], vendorName: string): string {
  const body = leads.map((l) => adfProspect(l, vendorName)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?adf version="1.0"?>\n<adf>\n${body}\n</adf>\n`;
}
