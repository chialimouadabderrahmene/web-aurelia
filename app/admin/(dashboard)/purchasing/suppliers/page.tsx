"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Phone, Mail } from "lucide-react";
import PurchasingTabs from "@/components/admin/PurchasingTabs";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
  poCount: number;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  function load() {
    fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));
  }

  useEffect(load, []);

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || undefined, email: email || undefined, address: address || undefined }),
    });
    setSaving(false);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setShowForm(false);
    load();
  }

  async function removeSupplier(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Suppliers</h1>
          <p className="mt-1 font-body text-sm text-ink/50">Who you source materials and stock from.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Supplier
        </button>
      </div>
      <PurchasingTabs />

      {showForm && (
        <form onSubmit={addSupplier} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-3 text-xs disabled:opacity-50">
              {saving ? "Saving…" : "Save Supplier"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <div key={s.id} className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg text-ink">{s.name}</p>
                {!s.isActive && <span className="font-body text-[11px] text-ink/40">Archived</span>}
              </div>
              <button onClick={() => removeSupplier(s.id)} className="text-ink/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-3 space-y-1.5 font-body text-sm text-ink/60">
              {s.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={13} /> {s.phone}
                </p>
              )}
              {s.email && (
                <p className="flex items-center gap-2">
                  <Mail size={13} /> {s.email}
                </p>
              )}
              {s.address && <p className="text-ink/40">{s.address}</p>}
            </div>
            <p className="mt-3 font-body text-xs text-ink/40">{s.poCount} purchase order(s)</p>
          </div>
        ))}
        {suppliers.length === 0 && <p className="font-body text-sm text-ink/40">No suppliers yet.</p>}
      </div>
    </div>
  );
}
