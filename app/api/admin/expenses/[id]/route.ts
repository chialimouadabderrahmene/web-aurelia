import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.expense.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
