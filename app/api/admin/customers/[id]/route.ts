import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("customers");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ customer });
}

const patchSchema = z.object({
  isVip: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("customers");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const before = await prisma.customer.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });

  const events: string[] = [];
  if (parsed.data.isVip !== undefined && parsed.data.isVip !== before.isVip) {
    events.push(parsed.data.isVip ? "Marked as VIP" : "Removed VIP status");
  }
  if (parsed.data.isBlacklisted !== undefined && parsed.data.isBlacklisted !== before.isBlacklisted) {
    events.push(parsed.data.isBlacklisted ? "Added to blacklist" : "Removed from blacklist");
  }
  if (parsed.data.tags !== undefined) {
    events.push(`Tags updated: ${parsed.data.tags.join(", ") || "(none)"}`);
  }
  for (const message of events) {
    await prisma.customerEvent.create({
      data: { customerId: id, type: "PROFILE_UPDATED", message },
    });
  }

  return NextResponse.json({ customer });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("customers");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "OWNER") {
    return NextResponse.json({ error: "Only the Owner can delete customers" }, { status: 403 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (customer._count.orders > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this customer has ${customer._count.orders} order(s). Delete their orders first.` },
      { status: 409 }
    );
  }

  await prisma.customer.delete({ where: { id } });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "CUSTOMER_DELETE",
    entityType: "Customer",
    entityId: id,
    summary: `Deleted customer "${customer.name}" (${customer.phone})`,
  });

  return NextResponse.json({ ok: true });
}
