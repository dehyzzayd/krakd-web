import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leadSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your name"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  message: z.string().max(1000).optional(),
  vehicleId: z.string().uuid().optional(),
}).refine((d) => d.phone?.trim() || d.email?.trim(), { message: "Add a phone or email so we can reach you" });

/* POST /api/v1/public/site/[slug]/lead → website form → CRM lead (source = Website, retains vehicle) */
export const POST = route(async (_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const w = await prisma.website.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");
  const dealershipId = w.dealershipId;

  const parsed = leadSchema.safeParse(await _req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  // only attach a vehicle-of-interest that actually belongs to this dealer
  let vehicleId: string | undefined;
  let vehicleLabel = "";
  if (d.vehicleId) {
    const v = await prisma.vehicle.findFirst({ where: { id: d.vehicleId, dealershipId }, select: { id: true, year: true, make: true, model: true } });
    if (v) { vehicleId = v.id; vehicleLabel = `${v.year} ${v.make} ${v.model}`; }
  }

  const lead = await prisma.lead.create({
    data: {
      dealershipId, vehicleId,
      firstName: d.firstName,
      lastName: d.lastName,
      emails: (d.email ? [{ value: d.email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
      phones: (d.phone ? [{ value: d.phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue,
      source: "Website",
      temperature: "WARM",
      ownerType: "AI", // Krakd AI follows up on new website leads
    },
  });

  // log the inbound message as the first activity, if any
  if (d.message?.trim()) {
    await prisma.leadActivity.create({
      data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: `Website enquiry: ${d.message.trim()}` },
    }).catch(() => {});
  }

  // notify the dealer's owner (best-effort)
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
  const ownerEmail = dealer?.users[0]?.email;
  if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${d.firstName} ${d.lastName ?? ""}`.trim(), source: "Website", vehicle: vehicleLabel, contact: d.phone ?? d.email ?? "", leadId: lead.id });

  return json({ ok: true }, 201);
});
