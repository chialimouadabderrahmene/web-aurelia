"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PackagePlus } from "lucide-react";
import StockTabs from "@/components/admin/StockTabs";

type ProductRow = {
  id: string;
  nameEn: string;
  category: string;
  stockQty: number;
  images: { url: string }[];
};

export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  async function save(id: string) {
    const stockQty = drafts[id];
    if (stockQty === undefined) return;
    const res = await fetch(`/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQty } : p)));
      setSaved(id);
      setTimeout(() => setSaved(null), 1500);
    }
  }

  const zeroStock = products.filter((p) => p.stockQty <= 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Stock</h1>
      {zeroStock.length > 0 && (
        <p className="mt-2 font-body text-sm text-amber-600">
          {zeroStock.length} product(s) out of stock — customers can still order (pre-order).
        </p>
      )}
      <StockTabs />

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Product</th>
              <th className="px-5 py-4 font-normal">Category</th>
              <th className="px-5 py-4 font-normal">Quantity</th>
              <th className="px-5 py-4 font-normal" />
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    )}
                    <span className="text-ink">{p.nameEn}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/70">{p.category.replaceAll("_", " ")}</td>
                <td className="px-5 py-4">
                  <input
                    type="number"
                    defaultValue={p.stockQty}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [p.id]: Number(e.target.value) }))
                    }
                    className={`w-24 rounded-lg border px-3 py-2 font-body text-sm ${
                      p.stockQty <= 0 ? "border-red-300" : "border-line"
                    }`}
                  />
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => save(p.id)}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs text-ink/60 hover:border-ink hover:text-ink"
                  >
                    {saved === p.id ? <Check size={14} className="text-emerald-600" /> : "Save"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  {p.stockQty <= 3 && (
                    <Link
                      href={`/admin/purchasing/new?productId=${p.id}`}
                      className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:border-amber-400 whitespace-nowrap"
                    >
                      <PackagePlus size={14} />
                      Reorder
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
