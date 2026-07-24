import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart, EXPENSE_CATEGORIES } from "@/lib/finance";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start } },
    orderBy: { date: "desc" },
    include: { createdByUser: { select: { name: true } } },
  });

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      label: e.label,
      amount: e.amount,
      note: e.note,
      createdByName: e.createdByUser?.name ?? null,
    })),
  });
}

const schema = z.object({
  date: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  label: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { date, category, label, amount, note } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      date: date ? new Date(date) : new Date(),
      category,
      label,
      amount,
      note,
      createdByUserId: auth.session.sub,
    },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "EXPENSE_CREATE",
    entityType: "Expense",
    entityId: expense.id,
    summary: `Added expense "${label}" — ${amount} DA (${category})`,
  });

  return NextResponse.json({ expense });
}
