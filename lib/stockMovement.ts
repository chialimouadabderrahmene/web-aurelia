import { PrismaClient } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function logStockMovement(
  params: {
    productId: string;
    type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "DAMAGE" | "RETURN";
    qtyChange: number;
    reason?: string | null;
    relatedOrderId?: string | null;
    relatedPoId?: string | null;
    actorName?: string | null;
  },
  tx: TxClient | typeof prisma = prisma
) {
  const product = await tx.product.findUnique({ where: { id: params.productId }, select: { stockQty: true } });
  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      qtyChange: params.qtyChange,
      qtyAfter: product?.stockQty ?? 0,
      reason: params.reason ?? null,
      relatedOrderId: params.relatedOrderId ?? null,
      relatedPoId: params.relatedPoId ?? null,
      actorName: params.actorName ?? null,
    },
  });
}
