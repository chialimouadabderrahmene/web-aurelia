import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const giftCards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ giftCards });
}

const schema = z.object({
  code: z.string().min(2).transform((s) => s.toUpperCase()),
  initialBalance: z.number().int().positive(),
  expiresAt: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.giftCard.findUnique({ where: { code: data.code } });
  if (existing) return NextResponse.json({ error: "Gift card code already exists" }, { status: 409 });

  const giftCard = await prisma.giftCard.create({
    data: {
      code: data.code,
      initialBalance: data.initialBalance,
      balance: data.initialBalance,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return NextResponse.json({ giftCard }, { status: 201 });
}
