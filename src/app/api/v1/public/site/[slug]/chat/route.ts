import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";
import { deliverAdf } from "@/lib/server/adfDelivery";
import { pushLeadToIntegrations } from "@/lib/server/integrationDelivery";
import { aiFirstTouch } from "@/lib/server/ai";
import { webConsentRecord } from "@/lib/consent";
import { contactKeys, findDuplicateLead, scoreSpam, nextAssignee } from "@/lib/server/leadPipeline";
import { rateLimit, clientIp } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// the widget runs on the dealer's own domain → permissive CORS
const CORS: Record<string, string> = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" };
const reply = (data: unknown, status: number) => Response.json(data, { status, headers: CORS });

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  phone: z.string().optional(),
  email: z.string().optional(),
  message: z.string().max(1000).optional(),
  consent: z.boolean().optional(),
  hp: z.string().optional(), // honeypot
}).refine((d) => d.phone?.trim() || d.email?.trim(), { message: "Add a phone or email" });

/* POST /api/v1/public/site/[slug]/chat → website chat-widget lead capture (CORS, public) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true } });
    if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");
    const dealershipId = w.dealershipId;

    const rl = await rateLimit("chat", clientIp(req), 10, 60);
    if (!rl.ok) return reply({ message: "Too many messages — try again shortly." }, 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    const d = parsed.data;
    if (d.hp?.trim()) return reply({ ok: true, reply: "Thanks!" }, 201); // honeypot
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
    const consent = d.consent ? { sms: webConsentRecord(ip), email: webConsentRecord(ip) } : {};
    const [first, ...rest] = d.name.trim().split(/\s+/);

    // returning chat visitor → re-engage the existing lead
    const dup = await findDuplicateLead(dealershipId, d.email, d.phone);
    if (dup) {
      await prisma.lead.update({ where: { id: dup.id, dealershipId }, data: { lastActivityAt: new Date() } });
      await prisma.leadActivity.create({ data: { dealershipId, leadId: dup.id, type: "NOTE", actorType: "SYSTEM", content: `Returning chat${d.message?.trim() ? `: ${d.message.trim()}` : ""}` } }).catch(() => {});
      return reply({ ok: true, reply: `Welcome back, ${first}! We've got your message.` }, 201);
    }

    const spam = scoreSpam({ firstName: first, lastName: rest.join(" "), email: d.email, phone: d.phone, message: d.message });
    const assignedToId = spam.isSpam ? null : await nextAssignee(dealershipId);

    const lead = await prisma.lead.create({
      data: {
        dealershipId,
        firstName: first, lastName: rest.join(" ") || null,
        emails: (d.email ? [{ value: d.email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
        phones: (d.phone ? [{ value: d.phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue,
        ...contactKeys(d.email, d.phone),
        source: "Website chat", temperature: "WARM", isSpam: spam.isSpam,
        ...(assignedToId ? { assignedToId, ownerType: "HUMAN" as const } : { ownerType: "AI" as const }),
        consent: consent as unknown as Prisma.InputJsonValue,
      },
    });
    if (d.message?.trim()) {
      await prisma.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: `Website chat: ${d.message.trim()}` } }).catch(() => {});
    }
    if (spam.isSpam) return reply({ ok: true, reply: `Thanks ${first}! We got your message.` }, 201);

    const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
    const ownerEmail = dealer?.users[0]?.email;
    if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: d.name.trim(), source: "Website chat", vehicle: "—", contact: d.phone ?? d.email ?? "", leadId: lead.id });
    void deliverAdf(dealershipId, lead.id).catch(() => {});
    void pushLeadToIntegrations(dealershipId, lead.id).catch(() => {});
    void aiFirstTouch(dealershipId, lead.id).catch(() => {});

    return reply({ ok: true, reply: `Thanks ${first}! We got your message and we'll reach out shortly.` }, 201);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return reply({ message: e instanceof HttpError ? e.message : "Something went wrong." }, status);
  }
}
