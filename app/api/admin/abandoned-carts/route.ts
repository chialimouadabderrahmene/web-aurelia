import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const carts = await prisma.abandonedCart.findMany({
    where: { recoveredOrderId: null },
    orderBy: { lastSeenAt: "desc" },
    take: 100,
  });

  const rows = carts.map((c) => ({
    id: c.id,
    phone: c.phone,
    name: c.name,
    items: JSON.parse(c.itemsJson) as { name: string; qty: number; price: number }[],
    totalAmount: c.totalAmount,
    lastSeenAt: c.lastSeenAt,
  }));

  return NextResponse.json({ carts: rows });
}
