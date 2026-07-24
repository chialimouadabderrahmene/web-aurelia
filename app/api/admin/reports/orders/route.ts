import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart } from "@/lib/finance";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("reports");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { phone: true } } },
  });

  const csv = toCsv(
    orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString(),
      status: o.status,
      customer: o.customerName,
      phone: o.customer.phone,
      wilaya: o.wilaya,
      commune: o.commune,
      totalAmount: o.totalAmount,
      discountAmount: o.discountAmount,
      deliveryPrice: o.deliveryPrice,
      totalCost: o.totalCost,
      amountDue: o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice,
    })),
    ["orderNumber", "date", "status", "customer", "phone", "wilaya", "commune", "totalAmount", "discountAmount", "deliveryPrice", "totalCost", "amountDue"]
  );

  return csvResponse(`orders-${range}.csv`, csv);
}
