"use client";

import { useEffect, useState } from "react";
import { formatDzd } from "@/lib/utils";

type Cart = {
  id: string;
  phone: string | null;
  name: string | null;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  lastSeenAt: string;
};

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]);

  useEffect(() => {
    fetch("/api/admin/abandoned-carts")
      .then((r) => r.json())
      .then((d) => setCarts(d.carts ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Abandoned Carts</h1>
      <p className="mt-2 font-body text-sm text-ink/50">
        Shoppers who added items but haven&apos;t completed checkout. Call to recover the sale.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Contact</th>
              <th className="px-5 py-4 font-normal">Items</th>
              <th className="px-5 py-4 font-normal">Value</th>
              <th className="px-5 py-4 font-normal">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {carts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/40">
                  No abandoned carts right now.
                </td>
              </tr>
            )}
            {carts.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4">
                  {c.phone ? (
                    <>
                      <p className="text-ink">{c.name ?? "Unknown"}</p>
                      <p className="text-xs text-ink/50">{c.phone}</p>
                    </>
                  ) : (
                    <span className="text-ink/40">Anonymous browsing</span>
                  )}
                </td>
                <td className="px-5 py-4 text-ink/70">
                  {c.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                </td>
                <td className="px-5 py-4 text-ink">{formatDzd(c.totalAmount)}</td>
                <td className="px-5 py-4 text-ink/40">
                  {new Date(c.lastSeenAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
