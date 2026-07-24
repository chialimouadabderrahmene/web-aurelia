import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { revalidateContentPages } from "@/lib/revalidate";

export async function GET() {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const items = await prisma.review.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

const schema = z.object({
  authorName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1),
  product: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const count = await prisma.review.count();
  const item = await prisma.review.create({
    data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? count },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "REVIEW_CREATE",
    entityType: "Review",
    entityId: item.id,
    summary: `Added review from "${item.authorName}"`,
  });

  revalidateContentPages();

  return NextResponse.json({ item });
}
