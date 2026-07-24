import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rangeStart } from "@/lib/finance";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("reports");
  if ("error" in auth) return auth.error;

  const range = req.nextUrl.searchParams.get("range") ?? "month";
  const start = rangeStart(range);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start } },
    orderBy: { date: "desc" },
    include: { createdByUser: { select: { name: true } } },
  });

  const csv = toCsv(
    expenses.map((e) => ({
      date: e.date.toISOString(),
      category: e.category,
      label: e.label,
      amount: e.amount,
      note: e.note,
      createdBy: e.createdByUser?.name ?? "",
    })),
    ["date", "category", "label", "amount", "note", "createdBy"]
  );

  return csvResponse(`expenses-${range}.csv`, csv);
}
