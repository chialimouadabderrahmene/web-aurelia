import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

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
  const affiliate = await prisma.affiliate.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ affiliate });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.affiliate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
