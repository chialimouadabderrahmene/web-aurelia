"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: 10,
    minOrderAmount: "",
    usageLimit: "",
    expiresAt: "",
  });

  function load() {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => setCoupons(d.coupons ?? []));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create coupon");
      return;
    }
    setForm({ code: "", type: "PERCENT", value: 10, minOrderAmount: "", usageLimit: "", expiresAt: "" });
    setShowForm(false);
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Coupons</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-3">
          <input
            required
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="input"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENT" | "FIXED" }))}
            className="input"
          >
            <option value="PERCENT">Percent %</option>
            <option value="FIXED">Fixed DA</option>
          </select>
          <input
            required
            type="number"
            placeholder="Value"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Min order amount (optional)"
            value={form.minOrderAmount}
            onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Usage limit (optional)"
            value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
            className="input"
          />
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="input"
          />
          {error && <p className="col-span-full font-body text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary col-span-full">
            Create Coupon
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Code</th>
              <th className="px-5 py-4 font-normal">Discount</th>
              <th className="px-5 py-4 font-normal">Usage</th>
              <th className="px-5 py-4 font-normal">Expires</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No coupons yet.
                </td>
              </tr>
            )}
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-mono text-ink">{c.code}</td>
                <td className="px-5 py-4 text-ink/70">
                  {c.type === "PERCENT" ? `${c.value}%` : formatDzd(c.value)}
                </td>
                <td className="px-5 py-4 text-ink/70">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-5 py-4 text-ink/40">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggle(c.id, c.isActive)}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase ${
                      c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
                    }`}
                  >
                    {c.isActive ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => remove(c.id)} className="text-ink/50 hover:text-red-600">
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
