"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Product = { id: string; nameEn: string };
type FlashSale = {
  id: string;
  name: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  products: { product: { nameEn: string } }[];
};

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    discountPercent: 20,
    startsAt: "",
    endsAt: "",
    productIds: [] as string[],
  });

  function load() {
    fetch("/api/admin/flash-sales")
      .then((r) => r.json())
      .then((d) => setSales(d.flashSales ?? []));
  }
  useEffect(() => {
    load();
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.productIds.length === 0) {
      setError("Select at least one product");
      return;
    }
    const res = await fetch("/api/admin/flash-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discountPercent: Number(form.discountPercent),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create flash sale");
      return;
    }
    setForm({ name: "", discountPercent: 20, startsAt: "", endsAt: "", productIds: [] });
    setShowForm(false);
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/flash-sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this flash sale?")) return;
    await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" });
    load();
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Flash Sales</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Flash Sale
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-6 space-y-4 rounded-xl3 bg-white p-6 shadow-soft">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input col-span-2"
            />
            <input
              required
              type="number"
              placeholder="% off"
              value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
              className="input"
            />
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              className="input"
            />
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <p className="mb-2 font-body text-xs uppercase tracking-wide text-ink/60">Products</p>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`rounded-full border px-3 py-1.5 font-body text-xs ${
                    form.productIds.includes(p.id) ? "border-ink bg-ink text-white" : "border-line text-ink/60"
                  }`}
                >
                  {p.nameEn}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">
            Create Flash Sale
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Name</th>
              <th className="px-5 py-4 font-normal">Discount</th>
              <th className="px-5 py-4 font-normal">Products</th>
              <th className="px-5 py-4 font-normal">Window</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No flash sales yet.
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 text-ink">{s.name}</td>
                <td className="px-5 py-4 text-ink/70">{s.discountPercent}%</td>
                <td className="px-5 py-4 text-ink/70">
                  {s.products.map((p) => p.product.nameEn).join(", ")}
                </td>
                <td className="px-5 py-4 text-ink/40 text-xs">
                  {new Date(s.startsAt).toLocaleDateString()} – {new Date(s.endsAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggle(s.id, s.isActive)}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase ${
                      s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
                    }`}
                  >
                    {s.isActive ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => remove(s.id)} className="text-ink/50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
