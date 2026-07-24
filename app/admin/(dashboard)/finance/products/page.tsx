"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";

type ProductCost = {
  id: string;
  nameEn: string;
  price: number;
  costPrice: number;
  materialCost: number;
  packagingCost: number;
  adsCost: number;
  otherCost: number;
};

export default function ProductCostsPage() {
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [commission, setCommission] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setCommission(d.settings.confirmationCommission));
  }, []);

  async function saveCommission() {
    if (commission === "") return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationCommission: Number(commission) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalRevenue = products.reduce((n, p) => n + p.price, 0);
  const totalCost = products.reduce((n, p) => n + p.costPrice, 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Product Costs</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Per-product cost breakdown and confirmation commission rate.
      </p>
      <FinanceTabs />

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Confirmation Commission</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          Amount paid to a confirmation agent for each order they confirm or deliver.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={commission}
            onChange={(e) => setCommission(e.target.value === "" ? "" : Number(e.target.value))}
            className="input w-40"
          />
          <span className="font-body text-sm text-ink/50">DA per order</span>
          <button onClick={saveCommission} disabled={saving} className="btn-primary !px-5 !py-3 text-xs disabled:opacity-50">
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Product Cost Breakdown</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          Edit material/packaging/ads/other cost per product from its edit page.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-line text-ink/50">
                <th className="py-3 pr-4 font-normal">Product</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Material</th>
                <th className="py-3 pr-4 font-normal">Packaging</th>
                <th className="py-3 pr-4 font-normal">Ads</th>
                <th className="py-3 pr-4 font-normal">Other</th>
                <th className="py-3 pr-4 font-normal">Total Cost</th>
                <th className="py-3 font-normal">Margin</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">
                    <Link href={`/admin/products/${p.id}/edit`} className="hover:text-gold">
                      {p.nameEn}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink/70">{formatDzd(p.price)}</td>
                  <td className="py-3 pr-4 text-ink/50">{formatDzd(p.materialCost)}</td>
                  <td className="py-3 pr-4 text-ink/50">{formatDzd(p.packagingCost)}</td>
                  <td className="py-3 pr-4 text-ink/50">{formatDzd(p.adsCost)}</td>
                  <td className="py-3 pr-4 text-ink/50">{formatDzd(p.otherCost)}</td>
                  <td className="py-3 pr-4 text-ink">{formatDzd(p.costPrice)}</td>
                  <td className="py-3 text-emerald-600">{formatDzd(p.price - p.costPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length > 0 && (
          <div className="mt-4 flex justify-end gap-8 border-t border-line pt-4 font-body text-sm">
            <span className="text-ink/50">
              Total list price: <span className="text-ink">{formatDzd(totalRevenue)}</span>
            </span>
            <span className="text-ink/50">
              Total cost: <span className="text-ink">{formatDzd(totalCost)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
