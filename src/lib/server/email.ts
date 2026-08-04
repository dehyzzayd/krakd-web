import "server-only";
import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
// Default to the verified krakd.io sender so production emails reach any recipient.
// Override per-env with EMAIL_FROM (must be an address on a Resend-verified domain).
const from = process.env.EMAIL_FROM ?? "Krakd <hello@krakd.io>";
const resend = key ? new Resend(key) : null;

// Testing safety net: if set, route EVERY email to this one inbox (never set in production).
const override = process.env.EMAIL_TEST_OVERRIDE;

async function send(to: string, subject: string, html: string) {
  const recipient = override || to;
  if (!resend) { console.log(`[email disabled] would send "${subject}" to ${recipient}`); return; }
  try {
    const { error } = await resend.emails.send({ from, to: recipient, subject, html });
    if (error) console.warn(`resend error to ${recipient}: ${error.message}`);
  } catch (e) {
    console.error("email failed:", e);
  }
}

/** Deliver a lead as ADF: the XML in the body (how most CRM/provider inboxes parse it)
 *  plus an attachment for the ones that want a file. */
export async function sendAdfEmail(to: string, subject: string, xml: string) {
  const recipient = override || to;
  if (!resend) { console.log(`[email disabled] would send ADF "${subject}" to ${recipient}`); return; }
  try {
    const { error } = await resend.emails.send({
      from, to: recipient, subject, text: xml,
      attachments: [{ filename: "lead.adf.xml", content: Buffer.from(xml, "utf8") }],
    });
    if (error) console.warn(`resend ADF error to ${recipient}: ${error.message}`);
  } catch (e) {
    console.error("ADF email failed:", e);
  }
}

/** A dealer messaging a lead from the CRM. Returns whether the provider actually accepted it. */
export async function sendLeadMessageEmail(p: { to: string; fromName: string; body: string }): Promise<{ sent: boolean; reason?: string }> {
  const recipient = override || p.to;
  if (!resend) return { sent: false, reason: "Email not connected" };
  const html = shell(`Message from ${p.fromName}`, `<p style="font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap">${p.body.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</p>`);
  try {
    const { error } = await resend.emails.send({ from, to: recipient, subject: `Message from ${p.fromName}`, html, text: p.body });
    if (error) { console.warn(`resend message error to ${recipient}: ${error.message}`); return { sent: false, reason: error.message }; }
    return { sent: true };
  } catch (e) {
    console.error("lead message email failed:", e);
    return { sent: false, reason: "Send failed" };
  }
}

/** Appointment confirmation / reminder to the customer. */
export async function sendAppointmentEmail(p: { to: string; subject: string; body: string; dealershipName: string }): Promise<boolean> {
  const recipient = override || p.to;
  if (!resend) { console.log(`[email disabled] would send appt "${p.subject}" to ${recipient}`); return false; }
  const safe = p.body.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
  const html = shell(p.subject, `<p style="font-size:14px;line-height:1.6;color:#374151">${safe}</p><p style="margin-top:14px;font-size:12px;color:#6b7280">— ${p.dealershipName}</p>`);
  try {
    const { error } = await resend.emails.send({ from, to: recipient, subject: p.subject, html, text: p.body });
    if (error) { console.warn(`resend appt error to ${recipient}: ${error.message}`); return false; }
    return true;
  } catch (e) { console.error("appt email failed:", e); return false; }
}

export async function sendOtpEmail(p: { to: string; code: string }) {
  await send(
    p.to,
    `Your Krakd verification code: ${p.code}`,
    shell(
      "Verify your email",
      `<p style="font-size:14px;line-height:1.6;color:#374151">Enter this code to continue setting up your Krakd account. It expires in 10 minutes.</p>
       <p style="margin:16px 0;font-size:34px;font-weight:800;letter-spacing:8px;color:#0d1117">${p.code}</p>
       <p style="font-size:13px;color:#6b7280">If you didn't request this, you can ignore this email.</p>`,
    ),
  );
}

const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1d21">
<table width="100%"><tr><td align="center" style="padding:32px 16px"><table width="480" style="background:#fff;border:1px solid #e4e7ec;border-radius:16px"><tr><td style="padding:24px 28px">
<span style="font-size:20px;font-weight:800;color:#0d1117">Krakd<span style="color:#2b6ba4">.</span></span>
<h1 style="margin:14px 0 8px;font-size:20px">${title}</h1>${body}</td></tr></table></td></tr></table></body></html>`;

export async function sendLeadNotification(p: { to: string; dealershipName: string; leadName: string; source: string; vehicle: string; contact: string; leadId: string }) {
  const leadUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/dashboard/leads/${p.leadId}`;
  await send(
    p.to,
    `🔔 New lead: ${p.leadName}${p.vehicle ? ` — ${p.vehicle}` : ""}`,
    shell(
      "You have a new lead.",
      `<p style="font-size:14px;line-height:1.6;color:#374151">A new lead just landed for <b>${p.dealershipName}</b>. Krakd AI is already following up.</p>
       <table width="100%" style="margin:14px 0;font-size:13px">
         <tr><td style="color:#6b7280;padding:4px 0">Name</td><td style="text-align:right;font-weight:600;padding:4px 0">${p.leadName}</td></tr>
         <tr><td style="color:#6b7280;padding:4px 0">Interested in</td><td style="text-align:right;font-weight:600;padding:4px 0">${p.vehicle || "—"}</td></tr>
         <tr><td style="color:#6b7280;padding:4px 0">Source</td><td style="text-align:right;font-weight:600;padding:4px 0">${p.source || "—"}</td></tr>
         <tr><td style="color:#6b7280;padding:4px 0">Contact</td><td style="text-align:right;font-weight:600;padding:4px 0">${p.contact || "—"}</td></tr>
       </table>
       <p style="margin:16px 0"><a href="${leadUrl}" style="background:#2b6ba4;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">View lead →</a></p>`,
    ),
  );
}

export async function sendTeamInviteEmail(p: { to: string; firstName: string; inviterName: string; dealershipName: string; token: string }) {
  const setupUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/reset?token=${encodeURIComponent(p.token)}`;
  await send(
    p.to,
    `${p.inviterName} invited you to ${p.dealershipName} on Krakd`,
    shell(
      "You've been added to the team",
      `<p style="font-size:14px;line-height:1.6;color:#374151">Hi ${p.firstName}, <b>${p.inviterName}</b> added you to <b>${p.dealershipName}</b> on Krakd. Set your password to jump in — leads, inventory, and your calendar are waiting.</p>
       <p style="margin:18px 0"><a href="${setupUrl}" style="background:#2b6ba4;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">Set your password →</a></p>
       <p style="font-size:13px;color:#6b7280">This link expires in 30 minutes. If you weren't expecting this, you can ignore it.</p>`,
    ),
  );
}

export async function sendPasswordResetEmail(p: { to: string; firstName: string; token: string }) {
  const resetUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/reset?token=${encodeURIComponent(p.token)}`;
  await send(
    p.to,
    "Reset your Krakd password",
    shell(
      "Reset your password",
      `<p style="font-size:14px;line-height:1.6;color:#374151">Hi ${p.firstName}, we got a request to reset your password. This link expires in 30 minutes.</p>
       <p style="margin:18px 0"><a href="${resetUrl}" style="background:#2b6ba4;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">Reset password →</a></p>
       <p style="font-size:13px;color:#6b7280">If you didn't request this, ignore this email.</p>`,
    ),
  );
}

// Terminology per business vertical — keeps the welcome email speaking the owner's language.
const VERTICAL_TERMS: Record<string, { biz: string; catalog: string }> = {
  AUTOMOTIVE: { biz: "dealership", catalog: "inventory" },
  REAL_ESTATE: { biz: "brokerage", catalog: "listings" },
  RESTAURANT: { biz: "restaurant", catalog: "menu" },
  SERVICES: { biz: "business", catalog: "services" },
  RETAIL: { biz: "store", catalog: "catalog" },
  MEDICAL: { biz: "practice", catalog: "services" },
  CONSTRUCTION: { biz: "company", catalog: "projects" },
  GENERIC: { biz: "business", catalog: "catalog" },
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function sendWelcomeEmail(p: {
  to: string; firstName: string; lastName?: string; dealershipName: string;
  customerId: string; email: string; priceLabel?: string; promo?: string; vertical?: string;
}) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const dash = `${base}/dashboard`;
  const t = VERTICAL_TERMS[p.vertical ?? "AUTOMOTIVE"] ?? VERTICAL_TERMS.AUTOMOTIVE;
  const nextBilling = new Date(Date.now() + 14 * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const ink = "#0a0a0a", accent = "#ff5a16", muted = "#8a8a8a", line = "#ececec";

  const row = (name: string, sub: string, price: string) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${line}">
        <div style="font-size:14px;font-weight:600;color:${ink}">${name}</div>
        <div style="font-size:12px;color:${muted};margin-top:2px">${sub}</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${line};text-align:right;font-size:14px;font-weight:600;color:${ink};white-space:nowrap">${price}</td>
    </tr>`;

  const meta = (k: string, v: string) => `
    <tr><td style="padding:5px 0;font-size:12.5px;color:${muted}">${k}</td>
    <td style="padding:5px 0;text-align:right;font-size:12.5px;font-weight:600;color:${ink}">${v}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#ebebeb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${ink}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 16px">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:${ink}">Krakd<span style="color:${accent}">.</span></span>
    </td></tr>

    <!-- hero card -->
    <tr><td style="background:${ink};border-radius:20px;padding:28px 28px 26px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent}">Welcome aboard</div>
      <h1 style="margin:10px 0 6px;font-size:26px;line-height:1.1;letter-spacing:-0.02em;color:#fff">Your ${t.biz} is live, ${p.firstName}.</h1>
      <p style="margin:0;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.7)"><b style="color:#fff">${p.dealershipName}</b> is set up — ${t.catalog}, CRM, marketing and Krakd AI, all on one screen.</p>
      <a href="${dash}" style="display:inline-block;margin-top:20px;background:${accent};color:#3a1500;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">Open your dashboard →</a>
    </td></tr>

    <tr><td style="height:14px"></td></tr>

    <!-- registration summary -->
    <tr><td style="background:#fff;border-radius:20px;padding:24px 28px">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.02em;color:${ink}">Registration summary</div>
      <table width="100%" style="margin-top:12px">
        ${meta("Contact", `${p.firstName} ${p.lastName ?? ""}`.trim())}
        ${meta(cap(t.biz), p.dealershipName)}
        ${meta("Customer ID", p.customerId)}
        ${meta("Email", p.email)}
        ${meta("Promo code", p.promo ?? "—")}
        ${meta("Next billing date", nextBilling)}
      </table>

      <div style="margin:20px 0 8px;font-size:13px;font-weight:700;color:${ink}">Your plan</div>
      <table width="100%">
        ${row("Krakd Platform + Krakd AI", `AI lead handling, CRM, ${t.catalog} & reporting`, p.priceLabel ?? "$149.00/mo")}
        ${row("Managed digital ads", "Optional — you fund the budget, Krakd takes 10%", "Pay as you go")}
      </table>

      <table width="100%" style="margin-top:14px">
        <tr><td style="font-size:13px;color:${muted}">Promo <b style="color:${ink}">${p.promo ?? "—"}</b></td>
        <td style="text-align:right;font-size:13px;font-weight:600;color:#1e9e5a">applied</td></tr>
        <tr><td style="padding-top:6px;font-size:15px;font-weight:700;color:${ink}">Due today</td>
        <td style="padding-top:6px;text-align:right;font-size:17px;font-weight:800;color:${accent}">$0.00</td></tr>
      </table>
      <p style="margin:10px 0 0;font-size:12px;color:${muted}">Beta access — no card charged. Card billing begins later; you'll get notice first. Cancel anytime.</p>
    </td></tr>

    <tr><td style="padding:20px 6px 0;text-align:center;font-size:12px;color:${muted}">
      Krakd — the operating system for local business.<br/>
      <span style="color:#b8b8b8">Privacy · Terms · Help center</span>
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  await send(p.to, `Welcome to Krakd, ${p.firstName} — ${p.dealershipName} is live 🎉`, html);
}
