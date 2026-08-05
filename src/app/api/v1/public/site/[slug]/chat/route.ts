import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/server/http";
import { chatReply } from "@/lib/server/chatbot";
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
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().trim().min(1).max(1000),
  hp: z.string().optional(), // honeypot
});

/* POST /api/v1/public/site/[slug]/chat → one conversational turn with the widget bot.
   Returns the bot's reply + a conversationId; captures the lead through the chat. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true } });
    if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");

    const rl = await rateLimit("chat", clientIp(req), 20, 60);
    if (!rl.ok) return reply({ message: "One sec — too many messages. Try again shortly." }, 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "Type a message.");
    const d = parsed.data;
    if (d.hp?.trim()) return reply({ reply: "Thanks!" }, 200); // honeypot

    const origin = process.env.APP_BASE_URL || req.nextUrl.origin;
    const ip = clientIp(req);
    const r = await chatReply(w.dealershipId, d.conversationId ?? undefined, d.message, origin, ip);
    return reply({ conversationId: r.conversationId, reply: r.reply }, 200);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return reply({ message: e instanceof HttpError ? e.message : "Something went wrong." }, status);
  }
}
