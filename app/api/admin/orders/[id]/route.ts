import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { applyOrderStatusChange } from "@/lib/orderTransition";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!order.isRead) {
    await prisma.order.update({ where: { id }, data: { isRead: true } });
  }

  return NextResponse.json({ order });
}

const patchSchema = z.object({
  status: z.enum(["PENDING", "TENTATIVE", "CONFIRMED", "POSTPONED", "DELIVERED", "CANCELLED"]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await applyOrderStatusChange(id, parsed.data.status, {
    note: parsed.data.note,
    actorName: auth.session.name,
    actorUserId: auth.session.sub,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json({ order: result.order });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "OWNER") {
    return NextResponse.json({ error: "Only the Owner can delete orders" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.order.delete({ where: { id } });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "ORDER_DELETE",
    entityType: "Order",
    entityId: id,
    summary: `Deleted order #${order.orderNumber} (${order.customerName}, ${order.status})`,
  });

  return NextResponse.json({ ok: true });
}
