import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart } from "@/lib/finance";

export async function GET() {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const monthStart = rangeStart("month");
  const todayStart = rangeStart("today");

  const [settings, receivableOrders, monthOrders, monthExpenses, todayExpenses, pendingCount] = await Promise.all([
    prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
      select: { cashBalance: true, confirmationCommission: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "TENTATIVE", "POSTPONED"] } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, deliveryPrice: true },
    }),
    prisma.order.findMany({
      where: { confirmedAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true, commissionCredited: true },
    }),
    prisma.expense.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { date: { gte: todayStart } }, _sum: { amount: true } }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const receivables = receivableOrders.reduce(
    (n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice),
    0
  );

  const monthRevenue = monthOrders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const monthCogs = monthOrders.reduce((n, o) => n + o.totalCost, 0);
  const monthCommissions = monthOrders.filter((o) => o.commissionCredited).length * settings.confirmationCommission;
  const monthExpensesTotal = monthExpenses._sum.amount ?? 0;
  const monthNetProfit = monthRevenue - monthCogs - monthCommissions - monthExpensesTotal;

  return NextResponse.json({
    cashBalance: settings.cashBalance,
    receivables,
    receivableCount: receivableOrders.length,
    pendingCount,
    monthNetProfit,
    monthExpensesTotal,
    todayExpensesTotal: todayExpenses._sum.amount ?? 0,
  });
}
