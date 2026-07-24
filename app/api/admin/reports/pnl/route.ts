import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/lib/finance";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("reports");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const [orders, expenses, settings] = await Promise.all([
    prisma.order.findMany({
      where: { confirmedAt: { gte: start }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true, commissionCredited: true },
    }),
    prisma.expense.findMany({ where: { date: { gte: start } }, select: { category: true, amount: true } }),
    prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" }, select: { confirmationCommission: true } }),
  ]);

  const revenue = orders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const cogs = orders.reduce((n, o) => n + o.totalCost, 0);
  const commissions = orders.filter((o) => o.commissionCredited).length * settings.confirmationCommission;
  const grossProfit = revenue - cogs;

  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const expensesTotal = expenses.reduce((n, e) => n + e.amount, 0);
  const netProfit = grossProfit - commissions - expensesTotal;

  const rows: { line: string; amount: number }[] = [
    { line: "Product Revenue", amount: revenue },
    { line: "Cost of Goods Sold", amount: -cogs },
    { line: "Gross Profit", amount: grossProfit },
    { line: "Agent Commissions", amount: -commissions },
    ...[...byCategory.entries()].map(([cat, total]) => ({
      line: `Expense: ${EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}`,
      amount: -total,
    })),
    { line: "Net Profit", amount: netProfit },
  ];

  const csv = toCsv(rows, ["line", "amount"]);

  return csvResponse(`pnl-${range}.csv`, csv);
}
