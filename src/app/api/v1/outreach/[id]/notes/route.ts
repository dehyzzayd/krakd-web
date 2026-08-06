import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING"]).default("NOTE"),
  content: z.string().trim().min(1, "Write something first"),
});

/* POST /api/v1/outreach/[id]/notes → log a note/call/email/meeting; stamps last-contacted */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const p = await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  const contact = await prisma.outreachContact.findUnique({ where: { id }, select: { id: true } });
  if (!contact) throw new HttpError(404, "Prospect not found");
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const u = await prisma.user.findUnique({ where: { id: p.userId }, select: { firstName: true, lastName: true, email: true } });
  const author = u ? `${u.firstName} ${u.lastName}`.trim() || u.email : "Krakd";

  const note = await prisma.outreachNote.create({ data: { contactId: id, type: parsed.data.type, content: parsed.data.content, authorId: p.userId, authorName: author }, select: { id: true } });
  // logging contact touches the "last contacted" clock
  if (parsed.data.type !== "NOTE") await prisma.outreachContact.update({ where: { id }, data: { lastContactedAt: new Date() } }).catch(() => {});
  return json({ id: note.id }, 201);
});
