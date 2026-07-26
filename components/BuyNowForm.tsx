"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDzd } from "@/lib/utils";
import { wilayas } from "@/lib/wilayas";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getSessionId } from "@/lib/session";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!DZ_PHONE.test(phone)) {
      setPhoneError(dict.buyNow.phoneInvalid);
      return;
    }
    setPhoneError("");
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
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : dict.checkout.error);
      return;
    }
    const data = await res.json();
    setOrderNumber(data.order.orderNumber);
    setDone(true);
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
    <form onSubmit={onSubmit} className="rounded-xl3 border border-gold/20 bg-sand/60 p-6">
      <p className="font-display text-lg text-ink">{header?.title ?? dict.buyNow.title}</p>
      <p className="mt-1 font-body text-xs text-ink/50">{header?.subtitle ?? dict.buyNow.subtitle}</p>

      <div className="mt-5 space-y-3">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={dict.checkout.fullNamePlaceholder}
          className="input"
        />
        <div>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            placeholder={dict.checkout.phonePlaceholder}
            className="input"
          />
          {phoneError && <p className="mt-1 font-body text-xs text-red-600">{phoneError}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            required
            value={wilaya}
            onChange={(e) => setWilaya(e.target.value)}
            className="input"
          >
            <option value="">{dict.checkout.selectWilaya}</option>
            {wilayas.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <input
            required
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            placeholder={dict.checkout.communePlaceholder}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["HOME", "STOPDESK"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDeliveryType(type)}
              className={`flex items-center justify-between rounded-xl2 border px-4 py-3 font-body text-xs transition-colors ${
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
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={dict.checkout.addressPlaceholder}
          className="input"
        />
      </div>

      <div className="mt-4 space-y-1 border-t border-ink/10 pt-4 font-body text-sm text-ink/70">
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
        <div className="flex justify-between pt-1 font-body text-base text-ink">
          <span>{dict.common.total}</span>
          <span>{formatDzd(total)}</span>
        </div>
      </div>

      {error && <p className="mt-3 font-body text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full disabled:opacity-50">
        {submitting ? dict.checkout.placingOrder : `${dict.buyNow.submit} — ${formatDzd(total)}`}
      </button>
      <p className="mt-2 text-center font-body text-xs text-ink/40">{dict.checkout.cod}</p>
    </form>
  );
}
