import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { revalidateContentPages } from "@/lib/revalidate";

const schema = z.object({
  authorName: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().min(1).optional(),
  product: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await prisma.review.update({ where: { id }, data: parsed.data });
  revalidateContentPages();

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await prisma.review.delete({ where: { id } }).catch(() => null);

  if (deleted) {
    await logAudit({
      actorId: auth.session.sub,
      actorName: auth.session.name,
      action: "REVIEW_DELETE",
      entityType: "Review",
      entityId: id,
      summary: `Deleted review from "${deleted.authorName}"`,
    });
  }

  revalidateContentPages();

  return NextResponse.json({ ok: true });
}
