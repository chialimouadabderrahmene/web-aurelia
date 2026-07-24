"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type Supplier = { id: string; name: string; isActive: boolean };
type ProductOption = { id: string; nameEn: string; sku: string };
type LineItem = { productId: string; nameEn: string; qty: number; unitCost: number };

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") ?? "";
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", nameEn: "", qty: 1, unitCost: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers((d.suppliers ?? []).filter((s: Supplier) => s.isActive)));
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products ?? []).map((p: ProductOption) => ({ id: p.id, nameEn: p.nameEn, sku: p.sku }));
        setProducts(list);
        if (preselectedProductId) {
          const p = list.find((x: ProductOption) => x.id === preselectedProductId);
          if (p) setItems([{ productId: p.id, nameEn: p.nameEn, qty: 50, unitCost: 0 }]);
        }
      });
  }, [preselectedProductId]);

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function pickProduct(i: number, productId: string) {
    const p = products.find((pr) => pr.id === productId);
    updateItem(i, { productId, nameEn: p ? p.nameEn : items[i].nameEn });
  }

  function addRow() {
    setItems((prev) => [...prev, { productId: "", nameEn: "", qty: 1, unitCost: 0 }]);
  }

  function removeRow(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((n, it) => n + it.qty * it.unitCost, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supplierId) {
      setError("Choose a supplier");
      return;
    }
    const validItems = items.filter((it) => it.nameEn.trim() && it.qty > 0);
    if (validItems.length === 0) {
      setError("Add at least one item");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        note: note || undefined,
        items: validItems.map((it) => ({
          productId: it.productId || undefined,
          nameEn: it.nameEn,
          qty: it.qty,
          unitCost: it.unitCost,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to create purchase order");
      return;
    }
    const data = await res.json();
    router.push(`/admin/purchasing/${data.purchaseOrder.id}`);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">New Purchase Order</h1>
      <p className="mt-1 font-body text-sm text-ink/50">Order stock or materials from a supplier.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Supplier</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input" required>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Items</h2>
            <button type="button" onClick={addRow} className="btn-secondary !px-4 !py-2 text-xs">
              <Plus size={14} className="mr-1" /> Add Row
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 rounded-xl2 border border-line p-4 sm:grid-cols-[1fr_1fr_100px_140px_36px]">
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-ink/50">Existing product (optional)</label>
                  <select value={it.productId} onChange={(e) => pickProduct(i, e.target.value)} className="input !py-2 text-sm">
                    <option value="">— custom item —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameEn} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-ink/50">Item name</label>
                  <input
                    value={it.nameEn}
                    onChange={(e) => updateItem(i, { nameEn: e.target.value })}
                    className="input !py-2 text-sm"
                    placeholder="e.g. Leather hides"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-ink/50">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
                    className="input !py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-ink/50">Unit Cost (DA)</label>
                  <input
                    type="number"
                    min={0}
                    value={it.unitCost}
                    onChange={(e) => updateItem(i, { unitCost: Number(e.target.value) })}
                    className="input !py-2 text-sm"
                  />
                </div>
                <button type="button" onClick={() => removeRow(i)} className="mt-6 text-ink/30 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end border-t border-line pt-4 font-body text-sm">
            <span className="text-ink/50">
              Total: <span className="text-ink">{formatDzd(total)}</span>
            </span>
          </div>
        </div>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary !px-6 !py-3 text-xs disabled:opacity-50">
          {saving ? "Creating…" : "Create Purchase Order"}
        </button>
      </form>
    </div>
  );
}
