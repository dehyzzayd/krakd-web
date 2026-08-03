import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { sendSms } from "@/lib/server/sms";
import { sendLeadMessageEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  channel: z.enum(["SMS", "EMAIL"]),
  content: z.string().trim().min(1, "Type a message"),
});

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as { value?: string }).value ?? "" : "");

/* POST /api/v1/leads/[id]/message → actually send an SMS/email to the lead, then log it.
 * If the channel provider isn't configured yet, we still record the message and report
 * back sent:false with a reason, so the composer can tell the truth. */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { channel, content } = parsed.data;

  const lead = await prisma.lead.findFirst({
    where: { id, dealershipId },
    select: { id: true, firstName: true, phones: true, emails: true, dealership: { select: { name: true } } },
  });
  if (!lead) throw new HttpError(404, "Lead not found");

  const to = channel === "SMS" ? first(lead.phones) : first(lead.emails);
  if (!to) throw new HttpError(400, channel === "SMS" ? "This lead has no phone number." : "This lead has no email address.");

  const result = channel === "SMS"
    ? await sendSms(to, content)
    : await sendLeadMessageEmail({ to, fromName: lead.dealership.name, body: content });

  // record it either way — a logged message the dealer can see beats a silent drop
  const prefix = result.sent ? "" : "[not sent] ";
  await prisma.$transaction([
    prisma.leadActivity.create({ data: { dealershipId, leadId: id, type: channel, actorType: "USER", content: `${prefix}To ${to}: ${content}` } }),
    prisma.lead.update({ where: { id }, data: { lastActivityAt: new Date() } }),
  ]);

  return json({ sent: result.sent, reason: result.reason ?? null, to }, 201);
});
