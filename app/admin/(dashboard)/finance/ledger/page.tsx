"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, HandCoins } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";

type LedgerEntry = {
  id: string;
  date: string;
  type: "SALE" | "COMMISSION" | "EXPENSE";
  label: string;
  amount: number;
  link: string | null;
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const TYPE_ICON = {
  SALE: ArrowUpCircle,
  COMMISSION: HandCoins,
  EXPENSE: ArrowDownCircle,
};

export default function LedgerPage() {
  const [range, setRange] = useState("month");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [netChange, setNetChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "SALE" | "COMMISSION" | "EXPENSE">("ALL");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/finance/ledger?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? []);
        setNetChange(d.netChange ?? 0);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.type === filter);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Transaction Ledger</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Every cash movement — sales, agent commissions, and expenses.
      </p>
      <FinanceTabs />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto">
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
        <div className="flex gap-2 overflow-x-auto">
          {(["ALL", "SALE", "COMMISSION", "EXPENSE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-4 py-2 font-body text-xs transition-colors ${
                filter === t ? "bg-gold text-white" : "bg-white text-ink/60 hover:text-ink"
              }`}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl3 bg-white p-6 shadow-soft">
        <p className="font-body text-xs uppercase tracking-wide text-ink/50">Net Change</p>
        <p className={`mt-1 font-display text-2xl ${netChange < 0 ? "text-red-600" : "text-ink"}`}>
          {netChange < 0 ? "−" : "+"}
          {formatDzd(Math.abs(netChange))}
        </p>
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        {loading && <p className="font-body text-sm text-ink/40">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="font-body text-sm text-ink/40">No transactions found.</p>
        )}
        <ul className="divide-y divide-line">
          {filtered.map((e) => {
            const Icon = TYPE_ICON[e.type];
            return (
              <li key={e.id} className="flex items-center gap-3 py-3.5">
                <Icon
                  size={18}
                  className={e.type === "EXPENSE" || e.type === "COMMISSION" ? "text-red-500/70" : "text-emerald-600/70"}
                />
                <div className="flex-1">
                  {e.link ? (
                    <Link href={e.link} className="font-body text-sm text-ink hover:text-gold">
                      {e.label}
                    </Link>
                  ) : (
                    <span className="font-body text-sm text-ink">{e.label}</span>
                  )}
                  <p className="font-body text-[11px] text-ink/40">
                    {new Date(e.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`font-body text-sm ${e.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {e.amount < 0 ? "−" : "+"}
                  {formatDzd(Math.abs(e.amount))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
