"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import Reveal from "@/components/Reveal";

type OrderStatus = "PENDING" | "TENTATIVE" | "CONFIRMED" | "POSTPONED" | "DELIVERED" | "CANCELLED";

type OrderEventRow = { status: OrderStatus; note: string | null; createdAt: string };

type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  confirmedAt: string | null;
  events: OrderEventRow[];
};

type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  amountDue: number;
};

const statusIcon: Record<OrderStatus, typeof CheckCircle2> = {
  PENDING: Clock,
  TENTATIVE: Clock,
  CONFIRMED: CheckCircle2,
  POSTPONED: Clock,
  DELIVERED: Home,
  CANCELLED: XCircle,
};

function TrackContent() {
  const params = useSearchParams();
  const { dict } = useLocale();

  const [mode, setMode] = useState<"order" | "phone">(params.get("order") ? "order" : "phone");
  const [orderId, setOrderId] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [orderList, setOrderList] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupOrder(id: string) {
    if (!id) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setOrderList(null);
    const res = await fetch(`/api/orders/track?order=${encodeURIComponent(id)}`);
    setLoading(false);
    if (!res.ok) {
      setError(dict.track.notFound);
      return;
    }
    const data = await res.json();
    setOrder(data.order);
  }

  async function lookupPhone(p: string) {
    if (!p) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setOrderList(null);
    const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(p)}`);
    setLoading(false);
    if (!res.ok) {
      setError(dict.track.notFoundPhone);
      return;
    }
    const data = await res.json();
    setOrderList(data.orders);
  }

  useEffect(() => {
    if (params.get("order")) lookupOrder(params.get("order")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepLabel: Record<OrderStatus, string> = {
    PENDING: dict.track.stepConfirmed,
    TENTATIVE: dict.track.tentativeMsg,
    CONFIRMED: dict.track.stepConfirmed,
    POSTPONED: dict.track.postponedMsg,
    DELIVERED: dict.track.stepDelivered,
    CANCELLED: dict.track.cancelledMsg,
  };

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <p className="eyebrow">{dict.track.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{dict.track.title}</h1>
      </Reveal>

      <div className="mt-8 flex gap-2">
        <button
          onClick={() => {
            setMode("order");
            setError("");
            setOrder(null);
            setOrderList(null);
          }}
          className={`rounded-full border px-4 py-2 font-body text-xs uppercase tracking-wide ${
            mode === "order" ? "border-ink bg-ink text-white" : "border-line text-ink/60"
          }`}
        >
          {dict.track.modeOrder}
        </button>
        <button
          onClick={() => {
            setMode("phone");
            setError("");
            setOrder(null);
            setOrderList(null);
          }}
          className={`rounded-full border px-4 py-2 font-body text-xs uppercase tracking-wide ${
            mode === "phone" ? "border-ink bg-ink text-white" : "border-line text-ink/60"
          }`}
        >
          {dict.track.modePhone}
        </button>
      </div>

      {mode === "order" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupOrder(orderId);
          }}
          className="mt-6 flex max-w-md gap-2"
        >
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={dict.track.placeholder}
            className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm placeholder:text-ink/40 focus:border-gold focus:outline-none"
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {loading ? dict.track.searching : dict.track.trackBtn}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupPhone(phone);
          }}
          className="mt-6 flex max-w-md gap-2"
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={dict.track.phonePlaceholder}
            className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm placeholder:text-ink/40 focus:border-gold focus:outline-none"
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {loading ? dict.track.searching : dict.track.trackBtn}
          </button>
        </form>
      )}

      {error && <p className="mt-6 font-body text-sm text-red-600">{error}</p>}

      {orderList && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 max-w-2xl space-y-3"
        >
          <p className="font-body text-xs uppercase tracking-wide text-ink/40">
            {dict.track.ordersFound.replace("{n}", String(orderList.length))}
          </p>
          {orderList.map((o) => (
            <button
              key={o.orderNumber}
              onClick={() => lookupOrder(o.orderNumber)}
              className="flex w-full items-center justify-between rounded-xl2 bg-sand p-4 text-left transition-colors hover:bg-gold/10"
            >
              <div>
                <p className="font-body text-sm text-ink">#{o.orderNumber}</p>
                <p className="font-body text-xs text-ink/50">
                  {new Date(o.createdAt).toLocaleDateString()} — {o.amountDue.toLocaleString("fr-FR")} DA
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs uppercase text-ink/60">{o.status}</span>
                <ChevronRight size={16} className="text-ink/40" />
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 max-w-2xl rounded-xl3 bg-sand p-8"
        >
          <p className="font-body text-sm text-ink/60">#{order.orderNumber}</p>

          {order.status === "CANCELLED" && (
            <div className="mt-6 flex items-center gap-3 rounded-xl2 bg-red-50 p-4">
              <XCircle size={20} className="text-red-500" />
              <p className="font-body text-sm text-red-700">{dict.track.cancelledMsg}</p>
            </div>
          )}
          {order.status === "POSTPONED" && (
            <div className="mt-6 flex items-center gap-3 rounded-xl2 bg-purple-50 p-4">
              <Clock size={20} className="text-purple-500" />
              <p className="font-body text-sm text-purple-700">{dict.track.postponedMsg}</p>
            </div>
          )}
          {order.status === "PENDING" && (
            <p className="mt-6 font-body text-sm text-ink/60">{dict.track.pendingMsg}</p>
          )}
          {order.status === "TENTATIVE" && (
            <p className="mt-6 font-body text-sm text-ink/60">{dict.track.tentativeMsg}</p>
          )}
          {order.status === "CONFIRMED" && (
            <p className="mt-6 font-body text-sm text-ink/60">{dict.track.confirmedMsg}</p>
          )}
          {order.status === "DELIVERED" && (
            <p className="mt-6 font-body text-sm text-ink/60">{dict.track.deliveredMsg}</p>
          )}

          <p className="mt-8 font-body text-xs uppercase tracking-wide text-ink/40">
            {dict.track.timelineTitle}
          </p>
          <ol className="mt-4 space-y-0">
            <AnimatePresence>
              {order.events.map((e, i) => {
                const Icon = statusIcon[e.status];
                const isLast = i === order.events.length - 1;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {!isLast && (
                      <span className="absolute left-[15px] top-8 h-full w-px bg-line" />
                    )}
                    <span
                      className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isLast ? "bg-gold text-white" : "bg-white text-ink/50 ring-1 ring-line"
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div className="pt-1">
                      <p className="font-body text-sm text-ink">{stepLabel[e.status]}</p>
                      {e.note && <p className="mt-0.5 font-body text-xs text-ink/50">{e.note}</p>}
                      <p className="mt-0.5 font-body text-xs text-ink/40">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </motion.div>
      )}
    </section>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackContent />
    </Suspense>
  );
}
