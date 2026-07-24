import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { computeSegment } from "@/lib/rfm";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("customers");
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q");
  const segmentFilter = req.nextUrl.searchParams.get("segment");

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: {
      orders: {
        where: { status: { not: "CANCELLED" }, confirmedAt: { not: null } },
        select: { totalAmount: true, discountAmount: true, giftCardAmount: true, confirmedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = customers
    .map((c) => {
      const lastOrderAt = c.orders.reduce<Date | null>((max, o) => {
        if (!o.confirmedAt) return max;
        return !max || o.confirmedAt > max ? o.confirmedAt : max;
      }, null);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        wilaya: c.wilaya,
        tags: c.tags,
        isVip: c.isVip,
        isBlacklisted: c.isBlacklisted,
        createdAt: c.createdAt,
        orderCount: c.orders.length,
        totalSpent: c.orders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0),
        segment: computeSegment(c.orders.length, lastOrderAt, c.createdAt),
      };
    })
    .filter((c) => !segmentFilter || c.segment === segmentFilter);

  return NextResponse.json({ customers: rows });
}
