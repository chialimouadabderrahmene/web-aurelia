import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/lib/finance";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const [orders, expenses, settings, monthlyOrders, monthlyExpenses] = await Promise.all([
    prisma.order.findMany({
      where: { confirmedAt: { gte: start }, status: { not: "CANCELLED" } },
      select: {
        totalAmount: true,
        discountAmount: true,
        giftCardAmount: true,
        totalCost: true,
        deliveryPrice: true,
        commissionCredited: true,
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start } },
      select: { category: true, amount: true },
    }),
    prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
      select: { confirmationCommission: true },
    }),
    prisma.order.findMany({
      where: { confirmedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) }, status: { not: "CANCELLED" } },
      select: { confirmedAt: true, totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true, commissionCredited: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } },
      select: { date: true, amount: true },
    }),
  ]);

  const rate = settings.confirmationCommission;

  const revenue = orders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const cogs = orders.reduce((n, o) => n + o.totalCost, 0);
  const deliveryCollected = orders.reduce((n, o) => n + o.deliveryPrice, 0);
  const commissionOrders = orders.filter((o) => o.commissionCredited).length;
  const commissions = commissionOrders * rate;
  const grossProfit = revenue - cogs;

  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) {
    expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount);
  }
  const expensesTotal = expenses.reduce((n, e) => n + e.amount, 0);

  const netProfit = grossProfit - commissions - expensesTotal;
  const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0;
  const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

  // 6-month trend
  const monthBuckets = new Map<string, { label: string; revenue: number; cogs: number; commissions: number; expenses: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets.set(key, {
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
      cogs: 0,
      commissions: 0,
      expenses: 0,
    });
  }
  for (const o of monthlyOrders) {
    if (!o.confirmedAt) continue;
    const d = new Date(o.confirmedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthBuckets.get(key);
    if (!bucket) continue;
    bucket.revenue += o.totalAmount - o.discountAmount - o.giftCardAmount;
    bucket.cogs += o.totalCost;
    if (o.commissionCredited) bucket.commissions += rate;
  }
  for (const e of monthlyExpenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthBuckets.get(key);
    if (!bucket) continue;
    bucket.expenses += e.amount;
  }

  const monthlyTrend = [...monthBuckets.values()].map((b) => ({
    label: b.label,
    revenue: b.revenue,
    netProfit: b.revenue - b.cogs - b.commissions - b.expenses,
  }));

  return NextResponse.json({
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    deliveryCollected,
    commissions,
    commissionOrders,
    commissionRate: rate,
    expensesByCategory: [...expensesByCategory.entries()].map(([category, total]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category,
      total,
    })).sort((a, b) => b.total - a.total),
    expensesTotal,
    netProfit,
    netMargin,
    orderCount: orders.length,
    monthlyTrend,
  });
}
