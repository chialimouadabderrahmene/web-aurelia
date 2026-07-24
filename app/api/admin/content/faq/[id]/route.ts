import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { revalidateContentPages } from "@/lib/revalidate";

const schema = z.object({
  questionEn: z.string().min(1).optional(),
  questionAr: z.string().min(1).optional(),
  answerEn: z.string().min(1).optional(),
  answerAr: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await prisma.faqItem.update({ where: { id }, data: parsed.data });
  revalidateContentPages();

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await prisma.faqItem.delete({ where: { id } }).catch(() => null);

  if (deleted) {
    await logAudit({
      actorId: auth.session.sub,
      actorName: auth.session.name,
      action: "FAQ_DELETE",
      entityType: "FaqItem",
      entityId: id,
      summary: `Deleted FAQ "${deleted.questionEn}"`,
    });
  }

  revalidateContentPages();

  return NextResponse.json({ ok: true });
}
