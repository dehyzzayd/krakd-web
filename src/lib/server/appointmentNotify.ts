import { prisma } from "@/lib/db";
import { sendSms } from "./sms";
import { sendAppointmentEmail } from "./email";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as { value?: string }).value ?? "" : "");
const TYPE_LABEL: Record<string, string> = {
  TEST_DRIVE: "test drive", DELIVERY: "delivery", PHONE: "call", SERVICE: "appointment", TRADE_APPRAISAL: "trade appraisal",
};

/** Text + email the customer a confirmation or reminder for their appointment.
 * Best-effort and channel-gated: SMS needs Twilio, email needs Resend. Returns
 * which channels actually delivered so callers can record it honestly. */
export async function notifyAppointment(apptId: string, kind: "confirmation" | "reminder"): Promise<{ sms: boolean; email: boolean }> {
  const a = await prisma.appointment.findUnique({
    where: { id: apptId },
    include: { lead: { select: { firstName: true, phones: true, emails: true } }, dealership: { select: { name: true, timezone: true } } },
  });
  if (!a) return { sms: false, email: false };

  const tz = a.dealership.timezone || "America/Chicago";
  const when = a.scheduledStart.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz });
  const typeLabel = TYPE_LABEL[a.type] ?? "appointment";
  const name = a.lead.firstName;
  const dealer = a.dealership.name;
  const body = kind === "confirmation"
    ? `Hi ${name}, your ${typeLabel} with ${dealer} is booked for ${when}. Need to change it? Just reply.`
    : `Reminder: your ${typeLabel} with ${dealer} is coming up — ${when}. See you then!`;
  const subject = kind === "confirmation" ? `Your ${typeLabel} is booked` : `Reminder: your ${typeLabel} with ${dealer}`;

  const phone = first(a.lead.phones);
  const email = first(a.lead.emails);
  const [sms, mail] = await Promise.all([
    phone ? sendSms(phone, body).then((r) => r.sent).catch(() => false) : Promise.resolve(false),
    email ? sendAppointmentEmail({ to: email, subject, body, dealershipName: dealer }).catch(() => false) : Promise.resolve(false),
  ]);
  return { sms, email: mail };
}
