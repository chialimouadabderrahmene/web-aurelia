"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";

type GiftCard = {
  id: string;
  code: string;
  initialBalance: number;
  balance: number;
  expiresAt: string | null;
  isActive: boolean;
};

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", initialBalance: 5000, expiresAt: "" });

  function load() {
    fetch("/api/admin/gift-cards")
      .then((r) => r.json())
      .then((d) => setCards(d.giftCards ?? []));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        initialBalance: Number(form.initialBalance),
        expiresAt: form.expiresAt || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create gift card");
      return;
    }
    setForm({ code: "", initialBalance: 5000, expiresAt: "" });
    setShowForm(false);
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/gift-cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this gift card?")) return;
    await fetch(`/api/admin/gift-cards/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Gift Cards</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> New Gift Card
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
          <input
            required
            type="number"
            placeholder="Balance (DA)"
            value={form.initialBalance}
            onChange={(e) => setForm((f) => ({ ...f, initialBalance: Number(e.target.value) }))}
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
            Create Gift Card
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Code</th>
              <th className="px-5 py-4 font-normal">Balance</th>
              <th className="px-5 py-4 font-normal">Expires</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal" />
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  No gift cards yet.
                </td>
              </tr>
            )}
            {cards.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-mono text-ink">{c.code}</td>
                <td className="px-5 py-4 text-ink/70">
                  {formatDzd(c.balance)} / {formatDzd(c.initialBalance)}
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
