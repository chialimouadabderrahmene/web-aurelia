import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: { select: { nameEn: true, price: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bundles });
}

const schema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  price: z.number().int().positive(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(2),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const bundle = await prisma.bundle.create({
    data: {
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      price: data.price,
      items: { create: data.items },
    },
    include: { items: { include: { product: { select: { nameEn: true, price: true } } } } },
  });

  return NextResponse.json({ bundle }, { status: 201 });
}
