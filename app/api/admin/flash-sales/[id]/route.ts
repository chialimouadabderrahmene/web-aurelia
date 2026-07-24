import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidateProductPages } from "@/lib/revalidate";

const schema = z.object({ isActive: z.boolean().optional() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const flashSale = await prisma.flashSale.update({ where: { id }, data: parsed.data });
  revalidateProductPages();
  return NextResponse.json({ flashSale });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.flashSale.delete({ where: { id } });
  revalidateProductPages();
  return NextResponse.json({ ok: true });
}
