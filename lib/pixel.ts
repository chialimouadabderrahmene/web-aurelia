// Client-side Meta Pixel helpers. Values passed to fbq('set', 'userData', ...)
// must be PLAIN (not pre-hashed) — the Pixel SDK hashes them itself before
// sending. Server-side Conversions API calls (lib/meta.ts) are the opposite:
// Meta requires those pre-hashed, since there's no client SDK there to do it.

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  return digits.startsWith("213") ? digits : `213${digits}`;
}

type CustomerContext = {
  phone: string;
  firstName?: string;
  commune?: string;
  wilaya?: string;
};

export function setPixelUserData(ctx: CustomerContext) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("set", "userData", {
    ph: normalizePhoneDigits(ctx.phone),
    fn: ctx.firstName?.trim().toLowerCase() || undefined,
    ct: ctx.commune?.trim().toLowerCase() || undefined,
    st: ctx.wilaya?.trim().toLowerCase() || undefined,
    country: "dz",
  });
}

type PurchaseItem = { slug: string; name: string; qty: number; price: number };

export function firePurchase(opts: {
  eventId: string;
  value: number;
  items: PurchaseItem[];
  customer: CustomerContext;
}) {
  if (typeof window === "undefined" || !window.fbq) return;
  setPixelUserData(opts.customer);
  window.fbq(
    "track",
    "Purchase",
    {
      value: opts.value,
      currency: "DZD",
      content_type: "product",
      content_ids: opts.items.map((i) => i.slug),
      content_name: opts.items.map((i) => i.name).join(", "),
      contents: opts.items.map((i) => ({ id: i.slug, quantity: i.qty, item_price: i.price })),
      num_items: opts.items.reduce((n, i) => n + i.qty, 0),
    },
    { eventID: opts.eventId }
  );
}

export function fireInitiateCheckout(opts: { items: PurchaseItem[]; value: number }) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "InitiateCheckout", {
    value: opts.value,
    currency: "DZD",
    content_type: "product",
    content_ids: opts.items.map((i) => i.slug),
    contents: opts.items.map((i) => ({ id: i.slug, quantity: i.qty, item_price: i.price })),
    num_items: opts.items.reduce((n, i) => n + i.qty, 0),
  });
}

export function fireViewContent(opts: { slug: string; name: string; price: number }) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "ViewContent", {
    value: opts.price,
    currency: "DZD",
    content_type: "product",
    content_ids: [opts.slug],
    content_name: opts.name,
  });
}
