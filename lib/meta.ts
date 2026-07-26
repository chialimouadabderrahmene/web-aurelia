import { createHash } from "crypto";
import { NextRequest } from "next/server";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  return digits.startsWith("213") ? digits : `213${digits}`;
}

type PurchasePayload = {
  eventId: string;
  orderNumber: string;
  value: number;
  phone: string;
  customerName: string;
  customerId: string;
  wilaya: string;
  commune: string;
  items: { slug: string; name: string; qty: number; price: number }[];
  req: NextRequest;
};

export async function sendPurchaseEvent({
  eventId,
  orderNumber,
  value,
  phone,
  customerName,
  customerId,
  wilaya,
  commune,
  items,
  req,
}: PurchasePayload) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!META_PIXEL_ID || !accessToken) return;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const fbp = cookieHeader.match(/_fbp=([^;]+)/)?.[1];
  const fbc = cookieHeader.match(/_fbc=([^;]+)/)?.[1];
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const [firstName, ...lastNameParts] = customerName.trim().split(/\s+/);
  const lastName = lastNameParts.join(" ");

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: req.headers.get("referer") ?? undefined,
        user_data: {
          ph: [sha256(normalizePhone(phone))],
          fn: firstName ? [sha256(firstName)] : undefined,
          ln: lastName ? [sha256(lastName)] : undefined,
          ct: [sha256(commune)],
          st: [sha256(wilaya)],
          country: [sha256("dz")],
          external_id: [sha256(customerId)],
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          fbp,
          fbc,
        },
        custom_data: {
          currency: "DZD",
          value,
          order_id: orderNumber,
          content_type: "product",
          content_ids: items.map((i) => i.slug),
          content_name: items.map((i) => i.name).join(", "),
          contents: items.map((i) => ({ id: i.slug, quantity: i.qty, item_price: i.price })),
          num_items: items.reduce((n, i) => n + i.qty, 0),
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    // best-effort server-side tracking, ignore failures
  });
}
