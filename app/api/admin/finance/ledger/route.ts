import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/lib/finance";

type LedgerEntry = {
  id: string;
  date: string;
  type: "SALE" | "COMMISSION" | "EXPENSE";
  label: string;
  amount: number;
  link: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const [orders, expenses, settings] = await Promise.all([
    prisma.order.findMany({
      where: { status: "DELIVERED", confirmedAt: { gte: start } },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        discountAmount: true,
        giftCardAmount: true,
        deliveryPrice: true,
        confirmedAt: true,
        commissionCredited: true,
        confirmedByUser: { select: { name: true } },
      },
      orderBy: { confirmedAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start } },
      orderBy: { date: "desc" },
    }),
    prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
      select: { confirmationCommission: true },
    }),
  ]);

  const entries: LedgerEntry[] = [];

  for (const o of orders) {
    entries.push({
      id: `sale-${o.id}`,
      date: (o.confirmedAt ?? new Date()).toISOString(),
      type: "SALE",
      label: `Order #${o.orderNumber} delivered`,
      amount: o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice,
      link: `/admin/orders/${o.id}`,
    });
    if (o.commissionCredited && o.confirmedByUser) {
      entries.push({
        id: `commission-${o.id}`,
        date: (o.confirmedAt ?? new Date()).toISOString(),
        type: "COMMISSION",
        label: `Commission — ${o.confirmedByUser.name} (#${o.orderNumber})`,
        amount: -settings.confirmationCommission,
        link: `/admin/orders/${o.id}`,
      });
    }
  }

  for (const e of expenses) {
    entries.push({
      id: `expense-${e.id}`,
      date: e.date.toISOString(),
      type: "EXPENSE",
      label: `${EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category} — ${e.label}`,
      amount: -e.amount,
      link: null,
    });
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const netChange = entries.reduce((n, e) => n + e.amount, 0);

  return NextResponse.json({ entries: entries.slice(0, 300), netChange });
}
