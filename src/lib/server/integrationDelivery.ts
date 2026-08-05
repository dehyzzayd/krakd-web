import { prisma } from "@/lib/db";
import { INTEGRATIONS, type IntegrationsRecord } from "@/lib/integrations";
import { sendDocEmail } from "./email";
import { buildCreditPdf } from "./creditPdf";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as { value?: string }).value ?? "" : "");
const postJson = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok).catch(() => false);

/** Push a new lead to every connected, live CRM integration (dealer-supplied webhook). */
export async function pushLeadToIntegrations(dealershipId: string, leadId: string): Promise<void> {
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, integrations: true } });
  const rec = (dealer?.integrations ?? {}) as IntegrationsRecord;
  const targets = INTEGRATIONS.filter((i) => i.category === "crm" && i.live && rec[i.id]?.enabled && rec[i.id]?.webhookUrl);
  if (!targets.length) return;

  const l = await prisma.lead.findFirst({ where: { id: leadId, dealershipId }, include: { vehicle: { select: { year: true, make: true, model: true, vin: true } } } });
  if (!l) return;
  const payload = {
    source: "Krakd",
    dealership: dealer?.name ?? "",
    lead: {
      id: l.id, firstName: l.firstName, lastName: l.lastName ?? "", email: first(l.emails), phone: first(l.phones),
      leadSource: l.source ?? "", status: l.status, temperature: l.temperature,
      vehicle: l.vehicle ? { year: l.vehicle.year, make: l.vehicle.make, model: l.vehicle.model, vin: l.vehicle.vin } : null,
      createdAt: l.createdAt.toISOString(),
    },
  };
  await Promise.all(targets.map((i) => postJson(String(rec[i.id].webhookUrl), { provider: i.id, ...payload })));
}

/** Deliver a submitted credit application to every connected, live credit integration
 *  (webhook POST and/or the PDF emailed to the provider's intake address). */
export async function deliverCreditAppToIntegrations(dealershipId: string, appId: string): Promise<void> {
  const dealer = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { name: true, brandColor: true, logoUrl: true, phone: true, addressLine1: true, city: true, state: true, integrations: true },
  });
  const rec = (dealer?.integrations ?? {}) as IntegrationsRecord;
  const targets = INTEGRATIONS.filter((i) => i.category === "credit" && i.live && rec[i.id]?.enabled && (rec[i.id]?.webhookUrl || rec[i.id]?.email));
  if (!targets.length) return;

  const app = await prisma.creditApplication.findFirst({ where: { id: appId, dealershipId }, select: { applicant: true, coApplicant: true, createdAt: true } });
  if (!app) return;
  const applicant = (app.applicant ?? {}) as Record<string, string>;
  const applicantName = `${applicant.firstName ?? ""} ${applicant.lastName ?? ""}`.trim() || "Applicant";

  // build the PDF once for any email targets
  let pdf: Buffer | null = null;
  const needPdf = targets.some((i) => rec[i.id]?.email);
  if (needPdf) {
    try {
      const contact = [dealer?.addressLine1, [dealer?.city, dealer?.state].filter(Boolean).join(", "), dealer?.phone].filter(Boolean).join("  ·  ");
      const doc = buildCreditPdf({ applicant, coApplicant: (app.coApplicant ?? null) as Record<string, string> | null, createdAt: app.createdAt }, { name: dealer?.name ?? "Dealership", brandColor: dealer?.brandColor ?? null, logoUrl: dealer?.logoUrl ?? null, contact, consentText: "" });
      pdf = Buffer.from(doc.output("arraybuffer"));
    } catch { /* skip pdf */ }
  }

  const jsonPayload = { source: "Krakd", dealership: dealer?.name ?? "", application: { applicant, coApplicant: app.coApplicant ?? null, submittedAt: app.createdAt.toISOString() } };

  await Promise.all(targets.map(async (i) => {
    const cfg = rec[i.id];
    if (cfg.webhookUrl) await postJson(String(cfg.webhookUrl), { provider: i.id, ...jsonPayload });
    if (cfg.email && pdf) await sendDocEmail({ to: String(cfg.email), subject: `Credit application — ${applicantName} (${dealer?.name ?? "Krakd"})`, text: `A new credit application from ${applicantName}, submitted via ${dealer?.name ?? "Krakd"}. PDF attached.`, filename: "credit-application.pdf", content: pdf });
  }));
}
