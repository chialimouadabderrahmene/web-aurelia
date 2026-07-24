import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyOrderStatusChange, VALID_TRANSITIONS } from "@/lib/orderTransition";

function extractString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

/**
 * Maps EcoTrack's free-text status label to our OrderStatus. EcoTrack's exact
 * vocabulary varies by delivery company; this does best-effort keyword
 * matching (French + English) and falls back to just logging the raw status
 * on the order timeline without changing state if nothing matches.
 */
function mapStatus(raw: string): string | null {
  const s = raw.toLowerCase();
  if (s.includes("non livr") || s.includes("échec") || s.includes("echec")) return null; // failed attempt, not delivered
  if (s.includes("livr") || s.includes("deliver")) return "DELIVERED";
  if (s.includes("retour") || s.includes("annul") || s.includes("cancel") || s.includes("return")) return "CANCELLED";
  if (s.includes("report") || s.includes("postpon")) return "POSTPONED";
  if (s.includes("confirm")) return "CONFIRMED";
  return null;
}

export async function POST(req: NextRequest) {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const secret = req.nextUrl.searchParams.get("secret");
  if (!settings?.ecotrackWebhookSecret || secret !== settings.ecotrackWebhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  const trackingId = extractString(obj, ["tracking", "Tracking", "tracking_id", "id"]);
  const externalRef = extractString(obj, ["id_Externe", "reference", "order_id", "external_id"]);
  const rawStatus = extractString(obj, ["status", "Status", "etat", "Etat", "status_label"]);

  if (!trackingId && !externalRef) {
    return NextResponse.json({ error: "Missing tracking id or reference" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: trackingId
      ? { OR: [{ ecotrackTrackingId: trackingId }, { orderNumber: externalRef ?? undefined }] }
      : { orderNumber: externalRef! },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found for this tracking id" }, { status: 404 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { ecotrackStatus: rawStatus ?? "unknown" } });

  const mapped = rawStatus ? mapStatus(rawStatus) : null;

  if (mapped && VALID_TRANSITIONS[order.status]?.includes(mapped)) {
    const result = await applyOrderStatusChange(order.id, mapped, {
      note: rawStatus ? `EcoTrack: ${rawStatus}` : null,
      actorName: "EcoTrack",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }
  } else if (rawStatus) {
    // Unmapped or not a valid transition from current state — log without changing status.
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `EcoTrack update: ${rawStatus}`,
        actorName: "EcoTrack",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
