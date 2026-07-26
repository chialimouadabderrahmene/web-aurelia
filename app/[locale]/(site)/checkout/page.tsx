"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatDzd } from "@/lib/utils";
import { wilayas } from "@/lib/wilayas";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getSessionId } from "@/lib/session";
import { fireInitiateCheckout, firePurchase } from "@/lib/pixel";

type DeliveryPrice = { wilayaCode: string; wilayaName: string; homePrice: number; stopdeskPrice: number };
type DeliveryType = "HOME" | "STOPDESK";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCodes, setShowCodes] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryPrice[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("HOME");
  const [confirmMsg, setConfirmMsg] = useState<{ title: string; body: string } | null>(null);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const selectedDelivery = deliveryPrices.find((d) => d.wilayaName === selectedWilaya);
  const deliveryFee = selectedDelivery
    ? deliveryType === "STOPDESK"
      ? selectedDelivery.stopdeskPrice
      : selectedDelivery.homePrice
    : 0;
  const total = subtotal + deliveryFee;
  const { dict, locale } = useLocale();
  const hasFiredInitiateCheckout = useRef(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (items.length === 0 || hasFiredInitiateCheckout.current) return;
    hasFiredInitiateCheckout.current = true;
    fireInitiateCheckout({
      items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, price: i.price })),
      value: subtotal,
    });
  }, [items, subtotal]);

  useEffect(() => {
    fetch("/api/public/delivery-prices")
      .then((r) => r.json())
      .then((d) => setDeliveryPrices(d.prices ?? []));
    fetch("/api/public/site-content")
      .then((r) => r.json())
      .then((d) => {
        const c = d.content;
        setConfirmMsg(
          locale === "ar"
            ? { title: c.orderConfirmTitleAr, body: c.orderConfirmBodyAr }
            : { title: c.orderConfirmTitleEn, body: c.orderConfirmBodyEn }
        );
      });
  }, [locale]);

  useEffect(() => {
    if (contactPhone.length < 8 || items.length === 0) return;
    const t = setTimeout(() => {
      fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          phone: contactPhone,
          name: contactName || undefined,
          items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          totalAmount: total,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [contactPhone, contactName, items, total]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasSubmitted.current) return;
    setError("");
    const form = new FormData(e.currentTarget);
    hasSubmitted.current = true;
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("name"),
        phone: form.get("phone"),
        wilaya: form.get("wilaya"),
        commune: form.get("commune"),
        address: (form.get("address") as string) || (form.get("commune") as string),
        couponCode: (form.get("couponCode") as string) || undefined,
        giftCardCode: (form.get("giftCardCode") as string) || undefined,
        referralCode: (form.get("referralCode") as string) || undefined,
        deliveryType,
        sessionId: getSessionId(),
        items: items.map((i) => ({
          slug: i.slug,
          name: i.name,
          color: i.color,
          colorHex: i.colorHex,
          price: i.price,
          qty: i.qty,
        })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      hasSubmitted.current = false;
      setError(dict.checkout.error);
      return;
    }
    const data = await res.json();
    setOrderId(data.order.orderNumber);
    setDone(true);
    clear();

    firePurchase({
      eventId: data.order.orderNumber,
      value: total,
      items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, price: i.price })),
      customer: {
        phone: contactPhone,
        firstName: contactName.split(/\s+/)[0],
        commune: (form.get("commune") as string) ?? "",
        wilaya: selectedWilaya,
      },
    });
  }

  if (done) {
    return (
      <div className="container-aurelia flex min-h-[70vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <CheckCircle2 size={56} className="text-gold" strokeWidth={1.2} />
        </motion.div>
        <h1 className="font-display text-3xl text-ink md:text-4xl">{confirmMsg?.title ?? dict.checkout.confirmedTitle}</h1>
        <p className="font-body text-sm text-ink">#{orderId}</p>
        <p className="max-w-sm font-body text-sm text-ink/60">{confirmMsg?.body ?? dict.checkout.confirmedBody}</p>
        <div className="mt-4 flex gap-3">
          <LocalizedLink href={`/track?order=${orderId}`} className="btn-secondary">
            {dict.checkout.trackOrder}
          </LocalizedLink>
          <LocalizedLink href="/collection" className="btn-primary">
            {dict.checkout.continueShopping}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-aurelia flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="font-display text-3xl text-ink">{dict.checkout.nothingTitle}</h1>
        <LocalizedLink href="/collection" className="btn-primary">
          {dict.checkout.shopNow}
        </LocalizedLink>
      </div>
    );
  }

  return (
    <section className="container-aurelia py-14 pb-32 md:py-20 md:pb-20">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{dict.checkout.title}</h1>
      <p className="mt-2 font-body text-sm text-ink/50">{dict.checkout.subtitle}</p>

      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3">
        <form id="checkout-form" onSubmit={onSubmit} className="space-y-5 md:col-span-2">
          <Field
            label={dict.checkout.fullName}
            name="name"
            placeholder={dict.checkout.fullNamePlaceholder}
            required
            onChange={setContactName}
          />
          <Field
            label={dict.checkout.phone}
            name="phone"
            type="tel"
            placeholder={dict.checkout.phonePlaceholder}
            required
            onChange={setContactPhone}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-wide text-ink/60">
                {dict.checkout.wilaya}
              </label>
              <select
                name="wilaya"
                required
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm text-ink focus:border-gold focus:outline-none"
              >
                <option value="">{dict.checkout.selectWilaya}</option>
                {wilayas.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <Field label={dict.checkout.commune} name="commune" placeholder={dict.checkout.communePlaceholder} required />
          </div>

          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-wide text-ink/60">
              {dict.checkout.deliveryType}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["HOME", "STOPDESK"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeliveryType(type)}
                  className={`flex items-center justify-between rounded-xl2 border px-5 py-3.5 font-body text-sm transition-colors ${
                    deliveryType === type
                      ? "border-gold bg-gold/5 text-ink"
                      : "border-line bg-cream text-ink/70 hover:border-ink/20"
                  }`}
                >
                  <span>{type === "HOME" ? dict.checkout.homeDelivery : dict.checkout.stopdesk}</span>
                  <span className="text-ink/50">
                    {selectedDelivery
                      ? formatDzd(type === "HOME" ? selectedDelivery.homePrice : selectedDelivery.stopdeskPrice)
                      : "—"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {deliveryType === "HOME" ? (
            <Field label={dict.checkout.address} name="address" placeholder={dict.checkout.addressPlaceholder} required />
          ) : (
            <p className="rounded-xl2 bg-gold/5 px-4 py-3 font-body text-xs text-ink/60">
              {dict.checkout.stopdeskNote}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowCodes((v) => !v)}
              className="font-body text-xs text-gold hover:underline"
            >
              {showCodes ? "− Hide promo codes" : "+ Have a coupon, gift card, or referral code?"}
            </button>
            {showCodes && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input name="couponCode" placeholder="Coupon code" className="input" />
                <input name="giftCardCode" placeholder="Gift card code" className="input" />
                <input name="referralCode" placeholder="Referred by (code)" className="input" />
              </div>
            )}
          </div>

          <div className="rounded-xl2 border border-gold/30 bg-gold/5 p-4 font-body text-sm text-ink/70">
            {dict.checkout.paymentMethod} <span className="font-medium text-ink">{dict.checkout.cod}</span>
          </div>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary hidden w-full disabled:opacity-50 md:block"
          >
            {submitting ? dict.checkout.placingOrder : `${dict.checkout.confirmOrder} — ${formatDzd(total)}`}
          </button>
        </form>

        <div className="h-fit rounded-xl3 bg-sand p-7">
          <h2 className="font-display text-xl text-ink">{dict.checkout.summary}</h2>
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li
                key={item.slug + item.color}
                className="flex justify-between font-body text-sm text-ink/70"
              >
                <span>
                  {item.name} × {item.qty}
                  <span className="text-ink/40"> ({item.color})</span>
                </span>
                <span>{formatDzd(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 font-body text-sm text-ink/70">
            <div className="flex justify-between">
              <span>{dict.common.subtotal}</span>
              <span>{formatDzd(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {dict.common.shipping}
                <span className="text-ink/40">
                  {" "}
                  ({deliveryType === "HOME" ? dict.checkout.homeDelivery : dict.checkout.stopdesk})
                </span>
              </span>
              <span>{selectedWilaya ? formatDzd(deliveryFee) : "—"}</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-body text-base text-ink">
            <span>{dict.common.total}</span>
            <span>{formatDzd(total)}</span>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className="flex w-full items-center justify-between rounded-xl3 bg-ink px-6 py-4 text-white transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <span className="font-body text-[15px] font-medium">
            {submitting ? dict.checkout.placingOrder : dict.checkout.confirmOrder}
          </span>
          <span className="font-display text-lg">{formatDzd(total)}</span>
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-body text-xs uppercase tracking-wide text-ink/60">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm text-ink placeholder:text-ink/40 focus:border-gold focus:outline-none"
      />
    </div>
  );
}
