import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { notifyAppointment } from "@/lib/server/appointmentNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* GET /api/v1/cron/appointment-reminders → same-day reminders for upcoming appointments.
   Runs daily (Vercel Cron). Protected by CRON_SECRET / x-vercel-cron. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authed = req.headers.get("authorization") === `Bearer ${secret}` || !!req.headers.get("x-vercel-cron");
  if (secret && !authed) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const horizon = new Date(now.getTime() + 18 * 3_600_000); // next ~18h catches "today"
  const due = await prisma.appointment.findMany({
    where: {
      scheduledStart: { gte: now, lte: horizon },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      reminderSentAt: null,
    },
    select: { id: true },
    take: 500,
  });

  let sent = 0;
  for (const a of due) {
    try {
      const r = await notifyAppointment(a.id, "reminder");
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSentAt: new Date() } });
      if (r.sms || r.email) sent++;
    } catch { /* skip and let the next run retry */ }
  }
  return Response.json({ considered: due.length, sent });
}
