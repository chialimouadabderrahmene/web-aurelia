"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Ban, X, Plus, Trash2, MessageCircle } from "lucide-react";
import { formatDzd, whatsappLink } from "@/lib/utils";
import StatusBadge from "@/components/admin/StatusBadge";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  giftCardAmount: number;
  createdAt: string;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string } | null;
};

type Event = { id: string; type: string; message: string; createdAt: string };

type CustomerDetail = {
  id: string;
  name: string;
  phone: string;
  wilaya: string | null;
  commune: string | null;
  address: string | null;
  tags: string[];
  isVip: boolean;
  isBlacklisted: boolean;
  referralCode: string;
  referredByCode: string | null;
  createdAt: string;
  orders: Order[];
  notes: Note[];
  events: Event[];
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [tab, setTab] = useState<"timeline" | "orders" | "notes">("timeline");
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function load() {
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer));
  }

  useEffect(load, [id]);
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(d.role === "OWNER"));
  }, []);

  async function deleteCustomer() {
    if (!customer) return;
    if (!confirm(`Permanently delete customer "${customer.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/admin/customers");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete customer");
    }
  }

  async function patch(data: Partial<{ isVip: boolean; isBlacklisted: boolean; tags: string[] }>) {
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function addNote() {
    if (!noteInput.trim()) return;
    await fetch(`/api/admin/customers/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteInput }),
    });
    setNoteInput("");
    load();
  }

  if (!customer) return <p className="font-body text-sm text-ink/50">Loading…</p>;

  const spent = customer.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);

  return (
    <div>
      <button onClick={() => router.back()} className="font-body text-sm text-ink/50 hover:text-ink">
        ← Back to customers
      </button>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-ink">{customer.name}</h1>
              {customer.isVip && <Crown size={18} className="text-gold" />}
              {customer.isBlacklisted && <Ban size={18} className="text-red-500" />}
            </div>
            {isOwner && (
              <button
                onClick={deleteCustomer}
                disabled={deleting}
                title={customer.orders.length > 0 ? "Delete their orders first" : "Delete customer"}
                className="flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1.5 font-body text-xs text-red-600 hover:border-red-400 disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-ink/50">{customer.phone}</p>
            <a
              href={whatsappLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-body text-xs text-emerald-700 hover:bg-emerald-100"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
          </div>

          <div className="mt-4 space-y-2 font-body text-sm text-ink/70">
            <p>{customer.wilaya}, {customer.commune}</p>
            <p>{customer.address}</p>
          </div>

          <div className="mt-4 flex gap-4 border-t border-line pt-4">
            <div>
              <p className="font-display text-xl text-ink">{customer.orders.length}</p>
              <p className="font-body text-[11px] uppercase text-ink/40">Orders</p>
            </div>
            <div>
              <p className="font-display text-xl text-ink">{formatDzd(spent)}</p>
              <p className="font-body text-[11px] uppercase text-ink/40">Total spent</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            <button
              onClick={() => patch({ isVip: !customer.isVip })}
              className={`flex-1 rounded-xl2 border px-3 py-2 font-body text-xs ${
                customer.isVip ? "border-gold bg-gold/10 text-gold" : "border-line text-ink/60"
              }`}
            >
              {customer.isVip ? "Remove VIP" : "Mark VIP"}
            </button>
            <button
              onClick={() => patch({ isBlacklisted: !customer.isBlacklisted })}
              className={`flex-1 rounded-xl2 border px-3 py-2 font-body text-xs ${
                customer.isBlacklisted ? "border-red-300 bg-red-50 text-red-600" : "border-line text-ink/60"
              }`}
            >
              {customer.isBlacklisted ? "Un-blacklist" : "Blacklist"}
            </button>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="font-body text-xs uppercase tracking-wide text-ink/40">Tags</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customer.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink/70"
                >
                  {t}
                  <button
                    onClick={() => patch({ tags: customer.tags.filter((x) => x !== t) })}
                    className="text-ink/40 hover:text-red-600"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    patch({ tags: [...customer.tags, tagInput.trim()] });
                    setTagInput("");
                  }
                }}
                placeholder="Add tag, Enter"
                className="input !py-2 text-xs"
              />
              <button
                onClick={() => {
                  if (tagInput.trim()) {
                    patch({ tags: [...customer.tags, tagInput.trim()] });
                    setTagInput("");
                  }
                }}
                className="rounded-xl2 border border-line px-3 text-ink/50 hover:text-ink"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-4 font-body text-xs text-ink/40">
            <p>Referral code: {customer.referralCode}</p>
            {customer.referredByCode && <p>Referred by: {customer.referredByCode}</p>}
            <p>Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex gap-2 overflow-x-auto">
            {(["timeline", "orders", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full border px-4 py-2 font-body text-xs uppercase tracking-wide ${
                  tab === t ? "border-ink bg-ink text-white" : "border-line text-ink/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl3 bg-white p-6 shadow-soft">
            {tab === "timeline" && (
              <ul className="space-y-4">
                {customer.events.length === 0 && (
                  <p className="font-body text-sm text-ink/40">No activity yet.</p>
                )}
                {customer.events.map((e) => (
                  <li key={e.id} className="flex gap-3 border-b border-line pb-4 last:border-0 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="font-body text-sm text-ink">{e.message}</p>
                      <p className="font-body text-xs text-ink/40">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {tab === "orders" && (
              <ul className="divide-y divide-line">
                {customer.orders.length === 0 && (
                  <p className="font-body text-sm text-ink/40">No orders yet.</p>
                )}
                {customer.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-body text-sm text-ink hover:text-gold">
                      #{o.orderNumber}
                    </Link>
                    <div className="flex items-center gap-4">
                      <span className="font-body text-sm text-ink/70">
                        {formatDzd(o.totalAmount - o.discountAmount - o.giftCardAmount)}
                      </span>
                      <StatusBadge status={o.status} />
                      <span className="font-body text-xs text-ink/40">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {tab === "notes" && (
              <div>
                <div className="flex gap-2">
                  <input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    placeholder="Add an internal note…"
                    className="input"
                  />
                  <button onClick={addNote} className="btn-primary !px-5 !py-3 text-xs whitespace-nowrap">
                    Add
                  </button>
                </div>
                <ul className="mt-5 space-y-4">
                  {customer.notes.length === 0 && (
                    <p className="font-body text-sm text-ink/40">No notes yet.</p>
                  )}
                  {customer.notes.map((n) => (
                    <li key={n.id} className="rounded-xl2 bg-sand p-4">
                      <p className="font-body text-sm text-ink">{n.body}</p>
                      <p className="mt-1.5 font-body text-xs text-ink/40">
                        {n.author?.name ?? "Unknown"} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
