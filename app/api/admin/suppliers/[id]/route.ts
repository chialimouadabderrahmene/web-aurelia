import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ supplier });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const poCount = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (poCount > 0) {
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, archived: true });
  }

  const supplier = await prisma.supplier.delete({ where: { id } }).catch(() => null);
  if (supplier) {
    await logAudit({
      actorId: auth.session.sub,
      actorName: auth.session.name,
      action: "SUPPLIER_DELETE",
      entityType: "Supplier",
      entityId: id,
      summary: `Deleted supplier "${supplier.name}"`,
    });
  }

  return NextResponse.json({ ok: true });
}
