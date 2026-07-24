"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  category: string;
  price: number;
  stockQty: number;
  originCountry: string;
  isPublished: boolean;
  images: { url: string }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Products</h1>
        <Link href="/admin/products/new" className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Product</th>
              <th className="px-5 py-4 font-normal">SKU</th>
              <th className="px-5 py-4 font-normal">Category</th>
              <th className="px-5 py-4 font-normal">Origin</th>
              <th className="px-5 py-4 font-normal">Price</th>
              <th className="px-5 py-4 font-normal">Stock</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-ink/40">
                  No products yet.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-sand/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                    )}
                    <span className="text-ink">{p.nameEn}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{p.sku}</td>
                <td className="px-5 py-4 text-ink/70">{p.category.replaceAll("_", " ")}</td>
                <td className="px-5 py-4 text-ink/70">{p.originCountry}</td>
                <td className="px-5 py-4 text-ink">{formatDzd(p.price)}</td>
                <td className="px-5 py-4">
                  <span className={p.stockQty <= 0 ? "text-red-600" : p.stockQty <= 3 ? "text-amber-600" : "text-ink/70"}>
                    {p.stockQty}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] uppercase ${
                      p.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
                    }`}
                  >
                    {p.isPublished ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-ink/50 hover:text-ink">
                      <Pencil size={16} />
                    </Link>
                    <button onClick={() => remove(p.id)} className="text-ink/50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
