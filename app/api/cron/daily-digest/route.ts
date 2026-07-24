import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailRoles } from "@/lib/email";
import { formatDzd } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const [newOrders, deliveredOrders, pendingCount, newCustomers, lowStock, settings] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, deliveryPrice: true },
    }),
    prisma.order.findMany({
      where: { status: "DELIVERED", confirmedAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.customer.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.product.count({ where: { stockQty: { lte: 3, gt: 0 } } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" }, select: { cashBalance: true } }),
  ]);

  const newOrdersTotal = newOrders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice), 0);
  const deliveredRevenue = deliveredOrders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const deliveredCost = deliveredOrders.reduce((n, o) => n + o.totalCost, 0);
  const deliveredProfit = deliveredRevenue - deliveredCost;

  const dateLabel = yesterdayStart.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  const html = `
    <h2>AURELIA — Daily Digest</h2>
    <p>${dateLabel}</p>
    <ul>
      <li><strong>${newOrders.length}</strong> new orders placed — ${formatDzd(newOrdersTotal)}</li>
      <li><strong>${deliveredOrders.length}</strong> orders delivered — ${formatDzd(deliveredRevenue)} revenue, ${formatDzd(deliveredProfit)} net profit</li>
      <li><strong>${newCustomers}</strong> new customers</li>
      <li><strong>${pendingCount}</strong> orders still pending confirmation</li>
      <li><strong>${lowStock}</strong> products low on stock (≤3 units)</li>
      <li>Cash on hand: <strong>${formatDzd(settings.cashBalance)}</strong></li>
    </ul>
    <p><a href="https://aurelia-amber.vercel.app/admin">Open admin panel</a></p>
  `;

  await emailRoles(["OWNER"], `AURELIA Daily Digest — ${dateLabel}`, html);

  return NextResponse.json({ ok: true, newOrders: newOrders.length, delivered: deliveredOrders.length });
}
