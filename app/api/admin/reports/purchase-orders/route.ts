import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const auth = await requireAdmin("reports");
  if ("error" in auth) return auth.error;

  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } }, items: true },
  });

  const csv = toCsv(
    orders.map((po) => ({
      poNumber: po.poNumber,
      supplier: po.supplier.name,
      status: po.status,
      createdAt: po.createdAt.toISOString(),
      receivedAt: po.receivedAt ? po.receivedAt.toISOString() : "",
      itemCount: po.items.length,
      totalCost: po.items.reduce((n, i) => n + i.unitCost * i.qty, 0),
    })),
    ["poNumber", "supplier", "status", "createdAt", "receivedAt", "itemCount", "totalCost"]
  );

  return csvResponse("purchase-orders.csv", csv);
}
