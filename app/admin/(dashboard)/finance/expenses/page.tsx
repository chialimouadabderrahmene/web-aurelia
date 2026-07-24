"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/lib/finance";

type Expense = {
  id: string;
  date: string;
  category: string;
  label: string;
  amount: number;
  note: string | null;
  createdByName: string | null;
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

export default function ExpensesPage() {
  const [range, setRange] = useState("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  function load() {
    setLoading(true);
    fetch(`/api/admin/expenses?range=${range}`)
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "" || !label.trim()) return;
    setSaving(true);
    await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, label, amount: Number(amount), note: note || undefined, date }),
    });
    setSaving(false);
    setLabel("");
    setAmount("");
    setNote("");
    setShowForm(false);
    load();
  }

  async function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
  }

  const total = expenses.reduce((n, e) => n + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Expenses</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Rent, salaries, marketing, and other operating costs.
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Expense
        </button>
      </div>
      <FinanceTabs />

      {showForm && (
        <form onSubmit={addExpense} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="input">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required className="input" placeholder="e.g. July rent" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Amount (DA)</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-3 text-xs disabled:opacity-50">
              {saving ? "Saving…" : "Save Expense"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-full px-4 py-2 font-body text-xs transition-colors ${
              range === r.key ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        {loading && <p className="font-body text-sm text-ink/40">Loading…</p>}
        {!loading && expenses.length === 0 && (
          <p className="font-body text-sm text-ink/40">No expenses recorded in this period.</p>
        )}
        {!loading && expenses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-line text-ink/50">
                  <th className="py-3 pr-4 font-normal">Date</th>
                  <th className="py-3 pr-4 font-normal">Category</th>
                  <th className="py-3 pr-4 font-normal">Label</th>
                  <th className="py-3 pr-4 font-normal">By</th>
                  <th className="py-3 pr-4 font-normal">Amount</th>
                  <th className="py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4 text-ink/60">{new Date(e.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink/70">
                        {EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ink">
                      {e.label}
                      {e.note && <span className="block text-xs text-ink/40">{e.note}</span>}
                    </td>
                    <td className="py-3 pr-4 text-ink/50">{e.createdByName ?? "—"}</td>
                    <td className="py-3 pr-4 text-ink">{formatDzd(e.amount)}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeExpense(e.id)} className="text-ink/30 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end border-t border-line pt-4 font-body text-sm">
              <span className="text-ink/50">
                Total: <span className="text-ink">{formatDzd(total)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
