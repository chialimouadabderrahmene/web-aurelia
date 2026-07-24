import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { getEcotrackLabelUrl } from "@/lib/ecotrack";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("orders");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!order.ecotrackTrackingId) {
    return NextResponse.json({ error: "No EcoTrack parcel on this order" }, { status: 400 });
  }

  const labelUrl = await getEcotrackLabelUrl(order.ecotrackTrackingId);
  if (!labelUrl) return NextResponse.json({ error: "EcoTrack integration not configured" }, { status: 400 });

  const res = await fetch(labelUrl);
  if (!res.ok) return NextResponse.json({ error: `EcoTrack returned ${res.status}` }, { status: 502 });

  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="label-${order.orderNumber}.pdf"`,
    },
  });
}
