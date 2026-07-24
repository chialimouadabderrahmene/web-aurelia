import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("stock");
  if ("error" in auth) return auth.error;

  const productId = req.nextUrl.searchParams.get("productId");
  const type = req.nextUrl.searchParams.get("type");

  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { nameEn: true, sku: true } } },
  });

  return NextResponse.json({
    movements: movements.map((m) => ({
      id: m.id,
      productName: m.product.nameEn,
      productSku: m.product.sku,
      type: m.type,
      qtyChange: m.qtyChange,
      qtyAfter: m.qtyAfter,
      reason: m.reason,
      actorName: m.actorName,
      createdAt: m.createdAt,
    })),
  });
}
