import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";

function generatePoNumber() {
  return `PO-${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const status = req.nextUrl.searchParams.get("status");

  const orders = await prisma.purchaseOrder.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true } },
      createdByUser: { select: { name: true } },
      items: true,
    },
  });

  return NextResponse.json({
    purchaseOrders: orders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplier.name,
      status: po.status,
      createdAt: po.createdAt,
      orderedAt: po.orderedAt,
      receivedAt: po.receivedAt,
      createdByName: po.createdByUser?.name ?? null,
      itemCount: po.items.length,
      totalCost: po.items.reduce((n, i) => n + i.unitCost * i.qty, 0),
    })),
  });
}

const schema = z.object({
  supplierId: z.string().min(1),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        nameEn: z.string().min(1),
        qty: z.number().int().positive(),
        unitCost: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  let poNumber = generatePoNumber();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.purchaseOrder.findUnique({ where: { poNumber } });
    if (!clash) break;
    poNumber = generatePoNumber();
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: parsed.data.supplierId,
      note: parsed.data.note,
      createdByUserId: auth.session.sub,
      items: {
        create: parsed.data.items.map((i) => ({
          productId: i.productId || null,
          nameEn: i.nameEn,
          qty: i.qty,
          unitCost: i.unitCost,
        })),
      },
    },
    include: { items: true, supplier: { select: { name: true } } },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "PO_CREATE",
    entityType: "PurchaseOrder",
    entityId: po.id,
    summary: `Created purchase order #${po.poNumber} with ${po.supplier.name} (${po.items.length} items)`,
  });

  return NextResponse.json({ purchaseOrder: po });
}
