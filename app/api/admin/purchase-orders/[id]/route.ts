import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { logStockMovement } from "@/lib/stockMovement";
import { revalidateProductPages } from "@/lib/revalidate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdByUser: { select: { name: true } },
      items: { include: { product: { select: { nameEn: true, stockQty: true } } } },
    },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ purchaseOrder: po });
}

const schema = z.object({ status: z.enum(["ORDERED", "RECEIVED", "CANCELLED"]) });

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ORDERED", "CANCELLED"],
  ORDERED: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("purchasing");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true, supplier: { select: { name: true } } },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!VALID_TRANSITIONS[po.status]?.includes(parsed.data.status)) {
    return NextResponse.json({ error: `Cannot move PO from ${po.status} to ${parsed.data.status}` }, { status: 409 });
  }

  if (parsed.data.status === "RECEIVED") {
    const totalCost = po.items.reduce((n, i) => n + i.unitCost * i.qty, 0);

    for (const item of po.items) {
      if (!item.productId) continue;
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.qty } },
      });
      await logStockMovement({
        productId: item.productId,
        type: "RESTOCK",
        qtyChange: item.qty,
        reason: `Received PO #${po.poNumber} — ${po.supplier.name}`,
        relatedPoId: po.id,
        actorName: auth.session.name,
      });
      await prisma.purchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: item.qty } });
    }

    await prisma.expense.create({
      data: {
        category: "INVENTORY",
        label: `PO #${po.poNumber} — ${po.supplier.name}`,
        amount: totalCost,
        note: po.note,
        createdByUserId: auth.session.sub,
      },
    });

    revalidateProductPages();
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: parsed.data.status,
      orderedAt: parsed.data.status === "ORDERED" ? new Date() : po.orderedAt,
      receivedAt: parsed.data.status === "RECEIVED" ? new Date() : po.receivedAt,
    },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "PO_STATUS_CHANGE",
    entityType: "PurchaseOrder",
    entityId: id,
    summary: `PO #${po.poNumber} → ${parsed.data.status}`,
  });

  return NextResponse.json({ purchaseOrder: updated });
}
