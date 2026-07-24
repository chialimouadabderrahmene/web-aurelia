import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidateProductPages } from "@/lib/revalidate";
import { logStockMovement } from "@/lib/stockMovement";
import { logAudit } from "@/lib/audit";

const schema = z.object({ stockQty: z.number().int(), reason: z.string().optional() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("stock");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const before = await prisma.product.findUnique({ where: { id }, select: { stockQty: true, nameEn: true } });
  if (!before) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const delta = parsed.data.stockQty - before.stockQty;

  const product = await prisma.product.update({
    where: { id },
    data: { stockQty: parsed.data.stockQty },
  });

  if (delta !== 0) {
    await logStockMovement({
      productId: id,
      type: "ADJUSTMENT",
      qtyChange: delta,
      reason: parsed.data.reason ?? "Manual stock edit",
      actorName: auth.session.name,
    });
    await logAudit({
      actorId: auth.session.sub,
      actorName: auth.session.name,
      action: "STOCK_ADJUST",
      entityType: "Product",
      entityId: id,
      summary: `Adjusted stock for "${before.nameEn}": ${before.stockQty} → ${parsed.data.stockQty}`,
    });
  }

  revalidateProductPages(product.slug);

  return NextResponse.json({ product });
}
