import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import type { Hour, Busy } from "@/lib/server/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUFFER_MIN = 15;

async function load(slug: string, id: string) {
  const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true, hours: true } });
  if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");
  const appt = await prisma.appointment.findFirst({ where: { id, dealershipId: w.dealershipId }, select: { id: true, scheduledStart: true, scheduledEnd: true, status: true } });
  if (!appt) throw new HttpError(404, "Booking not found");
  const d = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true, timezone: true, hours: true } });
  const hours = ((Array.isArray(d?.hours) && d.hours.length ? d.hours : w.hours) as Hour[] | undefined) ?? [];
  return { dealershipId: w.dealershipId, appt, tz: d?.timezone || "America/Chicago", name: d?.name ?? "the business", hours };
}

/* GET → the booking's current state (for the manage page) */
export const GET = route(async (_req: NextRequest, ctx: { params: Promise<{ slug: string; id: string }> }) => {
  const { slug, id } = await ctx.params;
  const { appt, tz, name } = await load(slug, id);
  return json({ id: appt.id, start: appt.scheduledStart.toISOString(), durationMin: Math.round((appt.scheduledEnd.getTime() - appt.scheduledStart.getTime()) / 60_000), status: appt.status, businessTz: tz, businessName: name });
});

const patchSchema = z.object({ start: z.string().datetime() });

/* PATCH → reschedule to a new start */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ slug: string; id: string }> }) => {
  const { slug, id } = await ctx.params;
  const c = await load(slug, id);
  if (c.appt.status === "CANCELED") throw new HttpError(400, "This booking was cancelled.");
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Invalid time");
  const start = new Date(parsed.data.start);
  if (isNaN(start.getTime()) || start.getTime() < Date.now()) throw new HttpError(400, "That time is no longer available.");
  const durationMin = Math.round((c.appt.scheduledEnd.getTime() - c.appt.scheduledStart.getTime()) / 60_000) || 30;
  const end = new Date(start.getTime() + durationMin * 60_000);

  const now = new Date();
  const busy: Busy[] = (await prisma.appointment.findMany({
    where: { dealershipId: c.dealershipId, id: { not: id }, scheduledStart: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + 31 * 86_400_000) }, status: { notIn: ["CANCELED"] } },
    select: { scheduledStart: true, scheduledEnd: true },
  })).map((r) => ({ start: r.scheduledStart, end: r.scheduledEnd }));
  const clash = busy.some((b) => start.getTime() < b.end.getTime() + BUFFER_MIN * 60_000 && end.getTime() > b.start.getTime() - BUFFER_MIN * 60_000);
  if (clash) throw new HttpError(409, "That slot was just taken. Please pick another.");

  await prisma.appointment.update({ where: { id }, data: { scheduledStart: start, scheduledEnd: end } });
  return json({ ok: true, start: start.toISOString() });
});

/* DELETE → cancel */
export const DELETE = route(async (_req: NextRequest, ctx: { params: Promise<{ slug: string; id: string }> }) => {
  const { slug, id } = await ctx.params;
  const c = await load(slug, id);
  await prisma.appointment.update({ where: { id: c.appt.id }, data: { status: "CANCELED" } });
  return json({ ok: true });
});
