"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDzd } from "@/lib/utils";
import { wilayas } from "@/lib/wilayas";
import { WILAYA_BY_NAME } from "@/lib/geo/wilayas-list";
import { COMMUNES_BY_WILAYA_CODE } from "@/lib/geo/communes";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getSessionId } from "@/lib/session";
import { fireInitiateCheckout, firePurchase } from "@/lib/pixel";

const DZ_PHONE = /^0[5-7][0-9]{8}$/;

type DeliveryPrice = { wilayaCode: string; wilayaName: string; homePrice: number; stopdeskPrice: number };
type DeliveryType = "HOME" | "STOPDESK";

export default function BuyNowForm({
  slug,
  productName,
  unitPrice,
  color,
  colorHex,
  qty,
}: {
  slug: string;
  productName: string;
  unitPrice: number;
  color: string;
  colorHex: string;
  qty: number;
}) {
  const { dict, locale } = useLocale();
  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryPrice[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("HOME");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [confirmMsg, setConfirmMsg] = useState<{ title: string; body: string } | null>(null);
  const [header, setHeader] = useState<{ title: string; subtitle: string } | null>(null);
  const hasFiredInitiateCheckout = useRef(false);
  const hasSubmitted = useRef(false);

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
        setHeader(
          locale === "ar"
            ? { title: c.buyNowTitleAr, subtitle: c.buyNowSubtitleAr }
            : { title: c.buyNowTitleEn, subtitle: c.buyNowSubtitleEn }
        );
      });
  }, [locale]);

  const selectedDelivery = deliveryPrices.find((d) => d.wilayaName === wilaya);
  const deliveryFee = selectedDelivery
    ? deliveryType === "STOPDESK"
      ? selectedDelivery.stopdeskPrice
      : selectedDelivery.homePrice
    : 0;
  const total = unitPrice * qty + deliveryFee;
  const communeOptions = wilaya ? COMMUNES_BY_WILAYA_CODE[WILAYA_BY_NAME[wilaya]?.code ?? ""] ?? [] : [];

  function onWilayaChange(value: string) {
    setWilaya(value);
    setCommune("");
  }

  function triggerInitiateCheckout() {
    if (hasFiredInitiateCheckout.current) return;
    hasFiredInitiateCheckout.current = true;
    fireInitiateCheckout({ items: [{ slug, name: productName, qty, price: unitPrice }], value: total });
  }

  useEffect(() => {
    if (phone.length < 8 || done) return;
    const t = setTimeout(() => {
      fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          phone,
          name: fullName || undefined,
          items: [{ name: productName, qty, price: unitPrice }],
          totalAmount: total,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [phone, fullName, productName, qty, unitPrice, total, done]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasSubmitted.current) return;
    setError("");

    if (!DZ_PHONE.test(phone)) {
      setPhoneError(dict.buyNow.phoneInvalid);
      return;
    }
    setPhoneError("");
    hasSubmitted.current = true;
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: fullName,
        phone,
        wilaya,
        commune,
        address: address || commune,
        deliveryType,
        sessionId: getSessionId(),
        items: [{ slug, name: productName, color, colorHex, price: unitPrice, qty }],
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      hasSubmitted.current = false;
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : dict.checkout.error);
      return;
    }
    const data = await res.json();
    setOrderNumber(data.order.orderNumber);
    setDone(true);

    firePurchase({
      eventId: data.order.orderNumber,
      value: total,
      items: [{ slug, name: productName, qty, price: unitPrice }],
      customer: { phone, firstName: fullName.split(/\s+/)[0], commune, wilaya },
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl3 bg-sand p-6 text-center"
      >
        <CheckCircle2 size={36} className="mx-auto text-gold" strokeWidth={1.2} />
        <p className="mt-3 font-display text-xl text-ink">{confirmMsg?.title ?? dict.checkout.confirmedTitle}</p>
        <p className="mt-1 font-body text-sm text-ink">#{orderNumber}</p>
        <p className="mt-2 font-body text-sm text-ink/60">{confirmMsg?.body ?? dict.checkout.confirmedBody}</p>
        <LocalizedLink href={`/track?order=${orderNumber}`} className="btn-secondary mt-4 inline-flex">
          {dict.checkout.trackOrder}
        </LocalizedLink>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl3 bg-ink p-6">
      <p className="font-display text-lg text-white">{header?.title ?? dict.buyNow.title}</p>
      <p className="mt-1 font-body text-xs text-white/50">{header?.subtitle ?? dict.buyNow.subtitle}</p>

      <div className="mt-5 space-y-3">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onFocus={triggerInitiateCheckout}
          placeholder={dict.checkout.fullNamePlaceholder}
          className="input !py-3.5 !text-base"
        />
        <div>
          <input
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            onFocus={triggerInitiateCheckout}
            placeholder={dict.checkout.phonePlaceholder}
            className="input !py-3.5 !text-base"
          />
          {phoneError && <p className="mt-1 font-body text-xs text-red-600">{phoneError}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            required
            value={wilaya}
            onChange={(e) => onWilayaChange(e.target.value)}
            className="input !py-3.5 !text-base"
          >
            <option value="">{dict.checkout.selectWilaya}</option>
            {wilayas.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <select
            required
            disabled={!wilaya}
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            className="input !py-3.5 !text-base disabled:opacity-50"
          >
            <option value="">
              {wilaya ? dict.checkout.selectCommune : dict.checkout.selectWilayaFirst}
            </option>
            {communeOptions.map((c) => (
              <option key={c.en} value={locale === "ar" ? c.ar : c.en}>
                {locale === "ar" ? c.ar : c.en}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["HOME", "STOPDESK"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDeliveryType(type)}
              className={`flex min-h-[52px] items-center justify-between rounded-xl2 border px-4 py-3 font-body text-xs transition-colors ${
                deliveryType === type
                  ? "border-gold bg-gold/10 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:border-white/30"
              }`}
            >
              <span>{type === "HOME" ? dict.checkout.homeDelivery : dict.checkout.stopdesk}</span>
              <span className="text-white/50">
                {selectedDelivery
                  ? formatDzd(type === "HOME" ? selectedDelivery.homePrice : selectedDelivery.stopdeskPrice)
                  : "—"}
              </span>
            </button>
          ))}
        </div>
        {deliveryType === "HOME" ? (
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={dict.checkout.addressPlaceholder}
            className="input !py-3.5 !text-base"
          />
        ) : (
          <p className="rounded-xl2 bg-gold/10 px-4 py-3 font-body text-xs text-white/70">
            {dict.checkout.stopdeskNote}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-1 border-t border-white/10 pt-4 font-body text-sm text-white/60">
        <div className="flex justify-between">
          <span>
            {productName} × {qty} ({color})
          </span>
          <span>{formatDzd(unitPrice * qty)}</span>
        </div>
        <div className="flex justify-between">
          <span>{dict.common.shipping}</span>
          <span>{wilaya ? formatDzd(deliveryFee) : "—"}</span>
        </div>
        <div className="flex justify-between pt-1 font-body text-base text-white">
          <span>{dict.common.total}</span>
          <span>{formatDzd(total)}</span>
        </div>
      </div>

      {error && <p className="mt-3 font-body text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl3 bg-gold px-8 py-4 font-body text-[13px] font-medium uppercase tracking-widest2 text-ink transition-all duration-500 ease-premium hover:bg-gold-soft active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? dict.checkout.placingOrder : `${dict.buyNow.submit} — ${formatDzd(total)}`}
      </button>
      <p className="mt-2 text-center font-body text-xs text-white/40">{dict.checkout.cod}</p>
    </form>
  );
}
