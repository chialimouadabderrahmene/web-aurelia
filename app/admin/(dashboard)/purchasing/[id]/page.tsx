"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatDzd } from "@/lib/utils";

type PoDetail = {
  id: string;
  poNumber: string;
  status: string;
  note: string | null;
  createdAt: string;
  orderedAt: string | null;
  receivedAt: string | null;
  supplier: { id: string; name: string; phone: string | null; email: string | null };
  createdByUser: { name: string } | null;
  items: { id: string; nameEn: string; qty: number; unitCost: number; receivedQty: number; product: { nameEn: string; stockQty: number } | null }[];
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-sand text-ink/60",
  ORDERED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [po, setPo] = useState<PoDetail | null>(null);
  const [updating, setUpdating] = useState(false);

  function load() {
    fetch(`/api/admin/purchase-orders/${id}`)
      .then((r) => r.json())
      .then((d) => setPo(d.purchaseOrder ?? null));
  }

  useEffect(load, [id]);

  async function transition(status: string) {
    if (status === "RECEIVED" && !confirm("Receiving this PO will add stock and record an expense. Continue?")) return;
    setUpdating(true);
    await fetch(`/api/admin/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    load();
  }

  if (!po) return <p className="font-body text-sm text-ink/40">Loading…</p>;

  const total = po.items.reduce((n, i) => n + i.qty * i.unitCost, 0);

  return (
    <div>
      <Link href="/admin/purchasing" className="font-body text-xs text-ink/50 hover:text-ink">
        ← Purchase Orders
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">PO #{po.poNumber}</h1>
          <p className="mt-1 font-body text-sm text-ink/50">{po.supplier.name}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 font-body text-xs ${STATUS_STYLE[po.status] ?? ""}`}>{po.status}</span>
      </div>

      <div className="mt-6 flex gap-3">
        {po.status === "DRAFT" && (
          <>
            <button onClick={() => transition("ORDERED")} disabled={updating} className="btn-primary !px-5 !py-3 text-xs disabled:opacity-50">
              Mark as Ordered
            </button>
            <button onClick={() => transition("CANCELLED")} disabled={updating} className="btn-secondary !px-5 !py-3 text-xs disabled:opacity-50">
              Cancel
            </button>
          </>
        )}
        {po.status === "ORDERED" && (
          <>
            <button onClick={() => transition("RECEIVED")} disabled={updating} className="btn-primary !px-5 !py-3 text-xs disabled:opacity-50">
              Receive Stock
            </button>
            <button onClick={() => transition("CANCELLED")} disabled={updating} className="btn-secondary !px-5 !py-3 text-xs disabled:opacity-50">
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl3 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-ink">Items</h2>
          <div className="overflow-x-auto">
          <table className="mt-4 w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-line text-ink/50">
                <th className="py-2.5 pr-4 font-normal">Item</th>
                <th className="py-2.5 pr-4 font-normal">Qty</th>
                <th className="py-2.5 pr-4 font-normal">Unit Cost</th>
                <th className="py-2.5 font-normal">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">
                    {it.nameEn}
                    {it.product && <span className="block text-xs text-ink/40">Stock now: {it.product.stockQty}</span>}
                  </td>
                  <td className="py-3 pr-4 text-ink/60">{it.qty}</td>
                  <td className="py-3 pr-4 text-ink/60">{formatDzd(it.unitCost)}</td>
                  <td className="py-3 text-ink">{formatDzd(it.qty * it.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="mt-4 flex justify-end border-t border-line pt-4 font-body text-sm">
            <span className="text-ink/50">
              Total: <span className="text-ink">{formatDzd(total)}</span>
            </span>
          </div>
        </div>

        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-ink">Details</h2>
          <dl className="mt-4 space-y-3 font-body text-sm">
            <div>
              <dt className="text-ink/40">Supplier</dt>
              <dd className="text-ink">{po.supplier.name}</dd>
            </div>
            {po.supplier.phone && (
              <div>
                <dt className="text-ink/40">Phone</dt>
                <dd className="text-ink">{po.supplier.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink/40">Created</dt>
              <dd className="text-ink">{new Date(po.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })} by {po.createdByUser?.name ?? "—"}</dd>
            </div>
            {po.orderedAt && (
              <div>
                <dt className="text-ink/40">Ordered</dt>
                <dd className="text-ink">{new Date(po.orderedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</dd>
              </div>
            )}
            {po.receivedAt && (
              <div>
                <dt className="text-ink/40">Received</dt>
                <dd className="text-ink">{new Date(po.receivedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</dd>
              </div>
            )}
            {po.note && (
              <div>
                <dt className="text-ink/40">Note</dt>
                <dd className="text-ink">{po.note}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
