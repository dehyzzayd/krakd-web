import "server-only";
import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Krakd <onboarding@resend.dev>";
const resend = key ? new Resend(key) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) { console.log(`[email disabled] would send "${subject}" to ${to}`); return; }
  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) console.warn(`resend error to ${to}: ${error.message}`);
  } catch (e) {
    console.error("email failed:", e);
  }
}

const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1d21">
<table width="100%"><tr><td align="center" style="padding:32px 16px"><table width="480" style="background:#fff;border:1px solid #e4e7ec;border-radius:16px"><tr><td style="padding:24px 28px">
<span style="font-size:20px;font-weight:800;color:#0d1117">Krakd<span style="color:#2b6ba4">.</span></span>
<h1 style="margin:14px 0 8px;font-size:20px">${title}</h1>${body}</td></tr></table></td></tr></table></body></html>`;

export async function sendWelcomeEmail(p: { to: string; firstName: string; dealershipName: string }) {
  const loginUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/dashboard`;
  await send(
    p.to,
    `Welcome to Krakd, ${p.firstName} 🎉`,
    shell(
      "Your dealership is live.",
      `<p style="font-size:14px;line-height:1.6;color:#374151">Hey ${p.firstName}, <b>${p.dealershipName}</b> is set up on Krakd — inventory, CRM, marketing and Krakd AI, all in one place.</p>
       <p style="margin:16px 0;padding:12px 14px;background:#f6f8fb;border:1px solid #e4e7ec;border-radius:10px;font-size:13px">Plan: <b>Krakd Platform · $149/mo</b> · Status: <b>Active</b> (BETAACCESS)</p>
       <p style="margin:18px 0"><a href="${loginUrl}" style="background:#2b6ba4;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">Open your dashboard →</a></p>`,
    ),
  );
}
