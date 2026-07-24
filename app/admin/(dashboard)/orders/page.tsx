"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDzd } from "@/lib/utils";
import StatusBadge from "@/components/admin/StatusBadge";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  status: string;
  totalAmount: number;
  isRead: boolean;
  createdAt: string;
  items: { id: string }[];
};

const tabs = ["ALL", "PENDING", "TENTATIVE", "CONFIRMED", "POSTPONED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = tab === "ALL" ? "" : `?status=${tab}`;
    fetch(`/api/admin/orders${qs}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Orders</h1>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 font-body text-xs uppercase tracking-wide ${
              tab === t ? "border-ink bg-ink text-white" : "border-line text-ink/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Order</th>
              <th className="px-5 py-4 font-normal">Customer</th>
              <th className="px-5 py-4 font-normal">Wilaya</th>
              <th className="px-5 py-4 font-normal">Items</th>
              <th className="px-5 py-4 font-normal">Total</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-line last:border-0 hover:bg-sand/60"
              >
                <td className="px-5 py-4">
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-2">
                    {!o.isRead && o.status === "PENDING" && (
                      <span className="h-2 w-2 rounded-full bg-gold" />
                    )}
                    <span className="text-ink">#{o.orderNumber}</span>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <p className="text-ink">{o.customerName}</p>
                  <p className="text-xs text-ink/40">{o.phone}</p>
                </td>
                <td className="px-5 py-4 text-ink/70">{o.wilaya}</td>
                <td className="px-5 py-4 text-ink/70">{o.items.length}</td>
                <td className="px-5 py-4 text-ink">{formatDzd(o.totalAmount)}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-4 text-ink/40">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
