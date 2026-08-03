import { prisma } from "@/lib/db";
import { buildAdf, type AdfLead } from "@/lib/server/adf";
import { sendAdfEmail } from "@/lib/server/email";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as Record<string, string>).value ?? "" : "");
type AdfConfig = { enabled?: boolean; emails?: string[] };

/** Best-effort: if the dealer has ADF delivery on, email the new lead as ADF XML
 *  to their configured CRM/provider inbox(es). Call fire-and-forget after create. */
export async function deliverAdf(dealershipId: string, leadId: string): Promise<void> {
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, adfConfig: true } });
  const cfg = (dealer?.adfConfig ?? {}) as AdfConfig;
  const emails = (cfg.emails ?? []).map((e) => e.trim()).filter(Boolean);
  if (!cfg.enabled || emails.length === 0) return;

  const l = await prisma.lead.findFirst({
    where: { id: leadId, dealershipId },
    include: { vehicle: { select: { year: true, make: true, model: true, trim: true, vin: true, stockNumber: true, priceCents: true } } },
  });
  if (!l) return;

  const adfLead: AdfLead = {
    firstName: l.firstName, lastName: l.lastName ?? "", email: first(l.emails), phone: first(l.phones),
    source: l.source ?? "Krakd", createdAt: l.createdAt, status: l.status,
    vehicle: l.vehicle ? { ...l.vehicle, stock: l.vehicle.stockNumber } : null,
  };
  const xml = buildAdf([adfLead], dealer?.name ?? "Dealership");
  const veh = l.vehicle ? ` — ${[l.vehicle.year, l.vehicle.make, l.vehicle.model].filter(Boolean).join(" ")}` : "";
  const subject = `ADF Lead — ${adfLead.firstName} ${adfLead.lastName}${veh}`.trim();
  await Promise.all(emails.map((to) => sendAdfEmail(to, subject, xml)));
}
