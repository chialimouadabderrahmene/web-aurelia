import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return NextResponse.json({
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      note: s.note,
      isActive: s.isActive,
      poCount: s._count.purchaseOrders,
    })),
  });
}

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const supplier = await prisma.supplier.create({ data: parsed.data });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "SUPPLIER_CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    summary: `Created supplier "${supplier.name}"`,
  });

  return NextResponse.json({ supplier });
}
