import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

const STATUSES = ["PENDING", "TENTATIVE", "CONFIRMED", "POSTPONED", "DELIVERED", "CANCELLED"] as const;
type OrderStatusValue = (typeof STATUSES)[number];

function isOrderStatus(value: string): value is OrderStatusValue {
  return (STATUSES as readonly string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const status = req.nextUrl.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status && isOrderStatus(status) ? { status } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ orders });
}
