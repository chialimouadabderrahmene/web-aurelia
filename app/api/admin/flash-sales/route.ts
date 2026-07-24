import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidateProductPages } from "@/lib/revalidate";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const flashSales = await prisma.flashSale.findMany({
    include: { products: { include: { product: { select: { nameEn: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ flashSales });
}

const schema = z.object({
  name: z.string().min(1),
  discountPercent: z.number().int().min(1).max(90),
  startsAt: z.string(),
  endsAt: z.string(),
  productIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const flashSale = await prisma.flashSale.create({
    data: {
      name: data.name,
      discountPercent: data.discountPercent,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      products: { create: data.productIds.map((productId) => ({ productId })) },
    },
    include: { products: { include: { product: { select: { nameEn: true } } } } },
  });

  revalidateProductPages();

  return NextResponse.json({ flashSale }, { status: 201 });
}
