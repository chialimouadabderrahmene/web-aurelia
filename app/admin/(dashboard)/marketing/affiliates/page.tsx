"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type Affiliate = {
  id: string;
  name: string;
  code: string;
  commissionRate: number;
  totalEarned: number;
  isActive: boolean;
};

type Referral = {
  id: string;
  name: string;
  phone: string;
  referrerName: string;
  createdAt: string;
};

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", code: "", commissionRate: 10 });

  function load() {
    fetch("/api/admin/affiliates")
      .then((r) => r.json())
      .then((d) => setAffiliates(d.affiliates ?? []));
    fetch("/api/admin/referrals")
      .then((r) => r.json())
      .then((d) => setReferrals(d.referrals ?? []));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, commissionRate: Number(form.commissionRate) }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create affiliate");
      return;
    }
    setForm({ name: "", code: "", commissionRate: 10 });
    setShowForm(false);
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this affiliate?")) return;
    await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Affiliates & Referrals</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Affiliate
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-3">
          <input
            required
            placeholder="Affiliate name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
          />
          <input
            required
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="input"
          />
          <input
            required
            type="number"
            placeholder="Commission %"
            value={form.commissionRate}
            onChange={(e) => setForm((f) => ({ ...f, commissionRate: Number(e.target.value) }))}
            className="input"
          />
          {error && <p className="col-span-full font-body text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary col-span-full">
            Create Affiliate
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Name</th>
              <th className="px-5 py-4 font-normal">Code</th>
              <th className="px-5 py-4 font-normal">Commission</th>
              <th className="px-5 py-4 font-normal">Total Earned</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No affiliates yet.
                </td>
              </tr>
            )}
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 text-ink">{a.name}</td>
                <td className="px-5 py-4 font-mono text-ink/70">{a.code}</td>
                <td className="px-5 py-4 text-ink/70">{a.commissionRate}%</td>
                <td className="px-5 py-4 text-ink">{formatDzd(a.totalEarned)}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggle(a.id, a.isActive)}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase ${
                      a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
                    }`}
                  >
                    {a.isActive ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => remove(a.id)} className="text-ink/50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl text-ink">Customer Referrals</h2>
      <div className="mt-4 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">New Customer</th>
              <th className="px-5 py-4 font-normal">Phone</th>
              <th className="px-5 py-4 font-normal">Referred By</th>
              <th className="px-5 py-4 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/40">
                  No referrals yet.
                </td>
              </tr>
            )}
            {referrals.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 text-ink">{r.name}</td>
                <td className="px-5 py-4 text-ink/70">{r.phone}</td>
                <td className="px-5 py-4 text-ink/70">{r.referrerName}</td>
                <td className="px-5 py-4 text-ink/40">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
