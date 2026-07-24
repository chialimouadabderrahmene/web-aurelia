"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type Product = { id: string; nameEn: string; price: number };
type Bundle = {
  id: string;
  nameEn: string;
  price: number;
  isActive: boolean;
  items: { qty: number; product: { nameEn: string; price: number } }[];
};

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    price: 0,
    items: [] as { productId: string; qty: number }[],
  });

  function load() {
    fetch("/api/admin/bundles")
      .then((r) => r.json())
      .then((d) => setBundles(d.bundles ?? []));
  }
  useEffect(() => {
    load();
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      items: f.items.some((i) => i.productId === id)
        ? f.items.filter((i) => i.productId !== id)
        : [...f.items, { productId: id, qty: 1 }],
    }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.items.length < 2) {
      setError("Select at least 2 products for a bundle");
      return;
    }
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create bundle");
      return;
    }
    setForm({ nameEn: "", nameAr: "", price: 0, items: [] });
    setShowForm(false);
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/bundles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this bundle?")) return;
    await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Bundles</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Bundle
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-6 space-y-4 rounded-xl3 bg-white p-6 shadow-soft">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              required
              placeholder="Name (English)"
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              className="input"
            />
            <input
              required
              dir="rtl"
              placeholder="Name (Arabic)"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              className="input"
            />
            <input
              required
              type="number"
              placeholder="Bundle price (DA)"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className="input"
            />
          </div>
          <div>
            <p className="mb-2 font-body text-xs uppercase tracking-wide text-ink/60">
              Products (min. 2)
            </p>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`rounded-full border px-3 py-1.5 font-body text-xs ${
                    form.items.some((i) => i.productId === p.id)
                      ? "border-ink bg-ink text-white"
                      : "border-line text-ink/60"
                  }`}
                >
                  {p.nameEn} — {formatDzd(p.price)}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">
            Create Bundle
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Bundle</th>
              <th className="px-5 py-4 font-normal">Includes</th>
              <th className="px-5 py-4 font-normal">Price</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {bundles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  No bundles yet.
                </td>
              </tr>
            )}
            {bundles.map((b) => {
              const separatePrice = b.items.reduce((n, i) => n + i.product.price * i.qty, 0);
              return (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 text-ink">{b.nameEn}</td>
                  <td className="px-5 py-4 text-ink/70">
                    {b.items.map((i) => `${i.product.nameEn} ×${i.qty}`).join(", ")}
                  </td>
                  <td className="px-5 py-4 text-ink">
                    {formatDzd(b.price)}{" "}
                    <span className="text-xs text-ink/40 line-through">{formatDzd(separatePrice)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggle(b.id, b.isActive)}
                      className={`rounded-full px-3 py-1 text-[11px] uppercase ${
                        b.isActive ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
                      }`}
                    >
                      {b.isActive ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => remove(b.id)} className="text-ink/50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
