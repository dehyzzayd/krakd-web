import { prisma } from "@/lib/db";
import { sendLeadMessageEmail } from "./email";
import { sendSms } from "./sms";
import { hasConsent } from "@/lib/consent";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as { value?: string }).value ?? "" : "");

/** Krakd AI's first touch on a fresh inbound lead: opens a conversation, sends an
 *  intro (email as an inquiry reply; SMS only with express consent), and logs it —
 *  so the AI dashboard reflects real activity, not zeros. Fire-and-forget. */
export async function aiFirstTouch(dealershipId: string, leadId: string): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, dealershipId },
    include: { vehicle: { select: { year: true, make: true, model: true } }, dealership: { select: { name: true } } },
  });
  if (!lead || lead.ownerType !== "AI") return;

  const name = lead.firstName;
  const dealer = lead.dealership.name;
  const veh = lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : null;
  const email = first(lead.emails);
  const phone = first(lead.phones);
  const canSms = !!phone && hasConsent(lead.consent, "sms");
  const canEmail = !!email; // reply to their own inquiry (transactional)

  const intro = `Hi ${name}, thanks for reaching out to ${dealer}!${veh ? ` I saw you're interested in the ${veh}.` : ""} I'm here to help — would you like to come take a look, or is there anything I can answer first? Just reply and I'll get right back to you.`;

  // prefer texting a consented mobile; otherwise reply by email
  let sent = false;
  let channel: "SMS" | "EMAIL" | "WEB" = "WEB";
  if (canSms) { channel = "SMS"; sent = await sendSms(phone, intro).then((r) => r.sent).catch(() => false); }
  if (!sent && canEmail) { channel = "EMAIL"; sent = await sendLeadMessageEmail({ to: email, fromName: `${dealer} · Krakd AI`, body: intro }).then((r) => r.sent).catch(() => false); }

  await prisma.aiConversation.create({
    data: {
      dealershipId, leadId, channel, status: sent ? "ACTIVE" : "HANDED_OFF",
      messages: { create: { role: "AI", content: intro } },
    },
  });

  if (sent) {
    await prisma.leadActivity.create({
      data: { dealershipId, leadId, type: "AI_MESSAGE", actorType: "SYSTEM", content: `Krakd AI ${channel === "SMS" ? "texted" : "emailed"} an intro to ${name}.` },
    }).catch(() => {});
  }
}
