import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const [count, latest] = await Promise.all([
    prisma.order.count({ where: { isRead: false, status: "PENDING" } }),
    prisma.order.findFirst({
      where: { isRead: false, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderNumber: true, customerName: true, totalAmount: true },
    }),
  ]);

  return NextResponse.json({ count, latest });
}
