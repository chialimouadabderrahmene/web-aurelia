"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDzd, whatsappLink } from "@/lib/utils";
import StatusBadge from "@/components/admin/StatusBadge";
import { Trash2, MessageCircle, Truck, Undo2, Printer } from "lucide-react";

type OrderItem = {
  id: string;
  nameEn: string;
  color: string;
  colorHex: string;
  price: number;
  qty: number;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  giftCardAmount: number;
  deliveryPrice: number;
  couponCode: string | null;
  statusNote: string | null;
  ecotrackTrackingId: string | null;
  ecotrackStatus: string | null;
  ecotrackError: string | null;
  createdAt: string;
  items: OrderItem[];
  events: { status: string; note: string | null; actorName: string | null; createdAt: string }[];
};

const TRANSITIONS: Record<string, { status: string; label: string; tone: string }[]> = {
  PENDING: [
    { status: "TENTATIVE", label: "Mark Tentative", tone: "secondary" },
    { status: "CONFIRMED", label: "Confirm Order", tone: "primary" },
    { status: "CANCELLED", label: "Cancel Order", tone: "danger" },
  ],
  TENTATIVE: [
    { status: "CONFIRMED", label: "Confirm Order", tone: "primary" },
    { status: "POSTPONED", label: "Postpone", tone: "secondary" },
    { status: "CANCELLED", label: "Cancel Order", tone: "danger" },
  ],
  CONFIRMED: [
    { status: "DELIVERED", label: "Mark Delivered", tone: "primary" },
    { status: "POSTPONED", label: "Postpone", tone: "secondary" },
    { status: "CANCELLED", label: "Cancel Order", tone: "danger" },
  ],
  POSTPONED: [
    { status: "CONFIRMED", label: "Re-confirm", tone: "primary" },
    { status: "DELIVERED", label: "Mark Delivered", tone: "primary" },
    { status: "CANCELLED", label: "Cancel Order", tone: "danger" },
  ],
  DELIVERED: [],
  CANCELLED: [],
};

function statusMessage(status: string, customerName: string, orderNumber: string): string {
  switch (status) {
    case "PENDING":
      return `Bonjour ${customerName}, nous avons bien reçu votre commande #${orderNumber} chez AURELIA. Nous vous appelons bientôt pour confirmer.`;
    case "TENTATIVE":
      return `Bonjour ${customerName}, concernant votre commande #${orderNumber}, pourriez-vous confirmer votre disponibilité ?`;
    case "CONFIRMED":
      return `Bonjour ${customerName}, votre commande #${orderNumber} est confirmée et en préparation. Merci pour votre confiance !`;
    case "POSTPONED":
      return `Bonjour ${customerName}, la livraison de votre commande #${orderNumber} a été reportée. Nous vous recontacterons pour reprogrammer.`;
    case "DELIVERED":
      return `Bonjour ${customerName}, votre commande #${orderNumber} a été livrée. Merci d'avoir choisi AURELIA !`;
    case "CANCELLED":
      return `Bonjour ${customerName}, votre commande #${orderNumber} a été annulée. N'hésitez pas à nous contacter pour toute question.`;
    default:
      return `Bonjour ${customerName}, concernant votre commande #${orderNumber}...`;
  }
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [note, setNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ecotrackBusy, setEcotrackBusy] = useState<"ship" | "return" | "label" | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(d.role === "OWNER"));
  }, [id]);

  async function deleteOrder() {
    if (!order) return;
    if (!confirm(`Permanently delete order #${order.orderNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/admin/orders");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete order");
    }
  }

  async function act(status: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setPendingStatus(null);
      setNote("");
    }
  }

  async function ecotrackAction(action: "ship" | "return") {
    setEcotrackBusy(action);
    const res = await fetch(`/api/admin/orders/${id}/ecotrack/${action}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setEcotrackBusy(null);
    if (res.ok) {
      const refreshed = await fetch(`/api/admin/orders/${id}`).then((r) => r.json());
      setOrder(refreshed.order);
    } else {
      alert(data.error ?? `EcoTrack ${action} failed`);
    }
  }

  async function printLabel() {
    setEcotrackBusy("label");
    window.open(`/api/admin/orders/${id}/ecotrack/label`, "_blank");
    setEcotrackBusy(null);
  }

  if (!order) return <p className="font-body text-sm text-ink/50">Loading…</p>;

  const options = TRANSITIONS[order.status] ?? [];
  const net = order.totalAmount - order.discountAmount - order.giftCardAmount + order.deliveryPrice;

  return (
    <div>
      <button onClick={() => router.back()} className="font-body text-sm text-ink/50 hover:text-ink">
        ← Back to orders
      </button>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Order #{order.orderNumber}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {isOwner && (
            <button
              onClick={deleteOrder}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 font-body text-xs text-red-600 hover:border-red-400 disabled:opacity-40"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft md:col-span-2">
          <h2 className="font-display text-lg text-ink">Items</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-ink/10"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div className="flex-1">
                  <p className="font-body text-sm text-ink">{item.nameEn}</p>
                  <p className="font-body text-xs text-ink/40">
                    {item.color} × {item.qty}
                  </p>
                </div>
                <p className="font-body text-sm text-ink">{formatDzd(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-line pt-4 font-body text-sm text-ink/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatDzd(order.totalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-gold">
                <span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>-{formatDzd(order.discountAmount)}</span>
              </div>
            )}
            {order.giftCardAmount > 0 && (
              <div className="flex justify-between text-gold">
                <span>Gift card</span>
                <span>-{formatDzd(order.giftCardAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery ({order.wilaya})</span>
              <span>{formatDzd(order.deliveryPrice)}</span>
            </div>
            <div className="flex justify-between pt-1.5 font-body text-base text-ink">
              <span>Amount due (COD)</span>
              <span>{formatDzd(net)}</span>
            </div>
          </div>

          {options.length > 0 && (
            <div className="mt-6 space-y-3">
              {!pendingStatus ? (
                <div className="flex flex-wrap gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt.status}
                      onClick={() => setPendingStatus(opt.status)}
                      disabled={busy}
                      className={
                        opt.tone === "primary"
                          ? "btn-primary flex-1"
                          : opt.tone === "danger"
                            ? "btn-secondary flex-1 !border-red-300 !text-red-600"
                            : "btn-secondary flex-1"
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 rounded-xl2 bg-sand p-4">
                  <p className="font-body text-sm text-ink">
                    Move to <span className="font-medium">{pendingStatus}</span>
                  </p>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full rounded-xl2 border border-line bg-white px-4 py-2.5 font-body text-sm focus:border-gold focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => act(pendingStatus)}
                      disabled={busy}
                      className="btn-primary !px-5 !py-2.5"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setPendingStatus(null)}
                      className="font-body text-sm text-ink/50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {order.statusNote && (
            <p className="mt-4 font-body text-sm text-ink/60">Note — {order.statusNote}</p>
          )}
          {order.ecotrackTrackingId && (
            <div className="mt-3 rounded-xl2 bg-sand p-4">
              <p className="font-body text-xs text-ink/50">
                EcoTrack tracking: <span className="text-ink">{order.ecotrackTrackingId}</span>
                {order.ecotrackStatus && ` — ${order.ecotrackStatus}`}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {order.ecotrackStatus === "created" && (
                  <button
                    onClick={() => ecotrackAction("ship")}
                    disabled={ecotrackBusy !== null}
                    className="btn-secondary !px-3.5 !py-2 text-xs disabled:opacity-40"
                  >
                    <Truck size={13} className="mr-1.5" />
                    {ecotrackBusy === "ship" ? "Shipping…" : "Ship via EcoTrack"}
                  </button>
                )}
                {order.ecotrackStatus === "shipped" && (
                  <button
                    onClick={() => ecotrackAction("return")}
                    disabled={ecotrackBusy !== null}
                    className="btn-secondary !px-3.5 !py-2 text-xs disabled:opacity-40"
                  >
                    <Undo2 size={13} className="mr-1.5" />
                    {ecotrackBusy === "return" ? "Requesting…" : "Request Return"}
                  </button>
                )}
                <button
                  onClick={printLabel}
                  disabled={ecotrackBusy !== null}
                  className="btn-secondary !px-3.5 !py-2 text-xs disabled:opacity-40"
                >
                  <Printer size={13} className="mr-1.5" />
                  Print Label
                </button>
              </div>
            </div>
          )}
          {order.ecotrackError && (
            <p className="mt-2 font-body text-xs text-red-600">
              EcoTrack error: {order.ecotrackError}
            </p>
          )}
        </div>

        <div className="h-fit rounded-xl3 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Customer</h2>
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="font-body text-xs text-gold hover:underline"
            >
              View profile
            </Link>
          </div>
          <dl className="mt-4 space-y-3 font-body text-sm">
            <Row label="Name" value={order.customerName} />
            <Row label="Phone" value={order.phone} />
            <Row label="Wilaya" value={order.wilaya} />
            <Row label="Commune" value={order.commune} />
            <Row label="Address" value={order.address} />
            <Row label="Placed" value={new Date(order.createdAt).toLocaleString()} />
          </dl>
          <a
            href={whatsappLink(order.phone, statusMessage(order.status, order.customerName, order.orderNumber))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl2 border border-emerald-200 bg-emerald-50 px-4 py-2.5 font-body text-sm text-emerald-700 hover:bg-emerald-100"
          >
            <MessageCircle size={16} />
            Notify on WhatsApp — {order.status}
          </a>
        </div>
      </div>

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Timeline</h2>
        <ol className="mt-5 space-y-0">
          {order.events.map((e, i) => {
            const isLast = i === order.events.length - 1;
            return (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && <span className="absolute left-[15px] top-8 h-full w-px bg-line" />}
                <span
                  className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isLast ? "bg-gold text-white" : "bg-sand text-ink/50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </span>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={e.status} />
                    {e.actorName && (
                      <span className="font-body text-xs text-ink/40">by {e.actorName}</span>
                    )}
                  </div>
                  {e.note && <p className="mt-1 font-body text-sm text-ink/70">{e.note}</p>}
                  <p className="mt-1 font-body text-xs text-ink/40">
                    {new Date(e.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
