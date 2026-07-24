"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import PurchasingTabs from "@/components/admin/PurchasingTabs";

type Po = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: string;
  createdAt: string;
  itemCount: number;
  totalCost: number;
  createdByName: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-sand text-ink/60",
  ORDERED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<Po[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/purchase-orders${filter === "ALL" ? "" : `?status=${filter}`}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.purchaseOrders ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Purchasing</h1>
          <p className="mt-1 font-body text-sm text-ink/50">Restock orders with your suppliers.</p>
        </div>
        <Link href="/admin/purchasing/new" className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Purchase Order
        </Link>
      </div>
      <PurchasingTabs />

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {["ALL", "DRAFT", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 font-body text-xs transition-colors ${
              filter === s ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        {loading && <p className="p-6 font-body text-sm text-ink/40">Loading…</p>}
        {!loading && orders.length === 0 && (
          <p className="p-6 font-body text-sm text-ink/40">No purchase orders yet.</p>
        )}
        {!loading && orders.length > 0 && (
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-line text-ink/50">
                <th className="px-5 py-4 font-normal">PO #</th>
                <th className="px-5 py-4 font-normal">Supplier</th>
                <th className="px-5 py-4 font-normal">Status</th>
                <th className="px-5 py-4 font-normal">Items</th>
                <th className="px-5 py-4 font-normal">Total Cost</th>
                <th className="px-5 py-4 font-normal">Created</th>
                <th className="px-5 py-4 font-normal">By</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-b border-line last:border-0 hover:bg-sand/40">
                  <td className="px-5 py-4">
                    <Link href={`/admin/purchasing/${po.id}`} className="text-ink hover:text-gold">
                      #{po.poNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink/70">{po.supplierName}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_STYLE[po.status] ?? ""}`}>{po.status}</span>
                  </td>
                  <td className="px-5 py-4 text-ink/50">{po.itemCount}</td>
                  <td className="px-5 py-4 text-ink">{formatDzd(po.totalCost)}</td>
                  <td className="px-5 py-4 text-ink/50">{new Date(po.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-4 text-ink/50">{po.createdByName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
