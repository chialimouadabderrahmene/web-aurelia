import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const affiliates = await prisma.affiliate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ affiliates });
}

const schema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).transform((s) => s.toUpperCase()),
  commissionRate: z.number().int().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.affiliate.findUnique({ where: { code: data.code } });
  if (existing) return NextResponse.json({ error: "Affiliate code already exists" }, { status: 409 });

  const affiliate = await prisma.affiliate.create({ data });
  return NextResponse.json({ affiliate }, { status: 201 });
}
