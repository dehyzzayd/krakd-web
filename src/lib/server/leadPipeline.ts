import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/* Inbound lead-ops pipeline: normalize → dedup → spam-score → auto-assign.
   Deterministic and dependency-free (no external spam API / LLM needed). */

export const normEmail = (s?: string | null) => (s ?? "").trim().toLowerCase() || null;
export const normPhone = (s?: string | null) => { const d = (s ?? "").replace(/\D/g, ""); return d.length >= 7 ? d : null; };

/** Contact keys to persist on a lead for dedup + search. */
export function contactKeys(email?: string | null, phone?: string | null) {
  return { primaryEmail: normEmail(email), primaryPhone: normPhone(phone) };
}

/** Returning-lead match within a dealership: email first, then phone. Skips spam. */
export async function findDuplicateLead(dealershipId: string, email?: string | null, phone?: string | null) {
  const e = normEmail(email);
  const p = normPhone(phone);
  if (!e && !p) return null;
  return prisma.lead.findFirst({
    where: {
      dealershipId, isSpam: false,
      OR: [...(e ? [{ primaryEmail: e }] : []), ...(p ? [{ primaryPhone: p }] : [])],
    },
    orderBy: { lastActivityAt: "desc" },
    select: { id: true },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DISPOSABLE = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "trashmail.com", "yopmail.com"];

/** Additive spam score from cheap signals (mirrors the reference's approach without the AI call). */
export function scoreSpam(input: { firstName?: string; lastName?: string; email?: string; phone?: string; message?: string }): { score: number; isSpam: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").replace(/\D/g, "");
  const name = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  const msg = input.message ?? "";

  if (email) {
    if (!EMAIL_RE.test(email)) { score += 3; reasons.push("invalid email"); }
    if (DISPOSABLE.some((d) => email.endsWith("@" + d))) { score += 3; reasons.push("disposable email"); }
  }
  if (phone && (phone.length < 10 || /^(\d)\1+$/.test(phone) || phone === "1234567890")) { score += 2; reasons.push("bogus phone"); }
  if (!email && !phone) { score += 3; reasons.push("no contact"); }

  // gibberish name: no vowels, long consonant runs, or random mixed-case tails ("wjmFO")
  const first = (input.firstName ?? "").trim();
  if (first) {
    if (first.length > 2 && !/[aeiou]/i.test(first)) { score += 2; reasons.push("vowelless name"); }
    if (/[a-z]{2}[A-Z]{2}/.test(first) || /[bcdfghjklmnpqrstvwxz]{5,}/i.test(first)) { score += 2; reasons.push("random-looking name"); }
  }
  // links / html in name or message
  if (/(https?:\/\/|www\.|<a\s|\[url)/i.test(name + " " + msg)) { score += 3; reasons.push("contains links"); }
  if (/[^\x00-\x7F]{4,}/.test(name)) { score += 2; reasons.push("non-ascii spam pattern"); }

  return { score, isSpam: score >= 5, reasons };
}

/** Round-robin (or owner) assignment of a new inbound lead per the dealership's routing setting. */
export async function nextAssignee(dealershipId: string): Promise<string | null> {
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { leadRouting: true } });
  const cfg = (dealer?.leadRouting ?? {}) as { autoAssign?: boolean; mode?: string; cursor?: number };
  if (!cfg.autoAssign) return null;

  if (cfg.mode === "owner") {
    const owner = await prisma.user.findFirst({ where: { dealershipId, role: "OWNER", status: "ACTIVE" }, select: { id: true } });
    return owner?.id ?? null;
  }
  // round-robin over active salespeople + managers, by stable order, advancing a persisted cursor
  const reps = await prisma.user.findMany({
    where: { dealershipId, status: "ACTIVE", role: { in: ["OWNER", "MANAGER", "STAFF"] } },
    orderBy: { createdAt: "asc" }, select: { id: true },
  });
  if (!reps.length) return null;
  const idx = ((cfg.cursor ?? -1) + 1) % reps.length;
  await prisma.dealership.update({ where: { id: dealershipId }, data: { leadRouting: { ...cfg, cursor: idx } as unknown as Prisma.InputJsonValue } });
  return reps[idx].id;
}
