import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { revalidateContentPages } from "@/lib/revalidate";

export async function GET() {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const items = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

const schema = z.object({
  questionEn: z.string().min(1),
  questionAr: z.string().min(1),
  answerEn: z.string().min(1),
  answerAr: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const count = await prisma.faqItem.count();
  const item = await prisma.faqItem.create({
    data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? count },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "FAQ_CREATE",
    entityType: "FaqItem",
    entityId: item.id,
    summary: `Added FAQ "${item.questionEn}"`,
  });

  revalidateContentPages();

  return NextResponse.json({ item });
}
