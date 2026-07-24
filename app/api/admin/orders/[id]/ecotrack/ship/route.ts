import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { shipEcotrackParcel } from "@/lib/ecotrack";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!order.ecotrackTrackingId) {
    return NextResponse.json({ error: "No EcoTrack parcel on this order" }, { status: 400 });
  }

  const result = await shipEcotrackParcel(order.ecotrackTrackingId);
  await prisma.order.update({
    where: { id },
    data: result.ok ? { ecotrackStatus: "shipped", ecotrackError: null } : { ecotrackError: result.error },
  });
  if (result.ok) {
    await prisma.orderEvent.create({
      data: { orderId: id, status: order.status, note: "EcoTrack: parcel shipped", actorName: auth.session.name },
    });
  }

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
