"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Clock, TrendingUp, Receipt, ArrowRight } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";

type Overview = {
  cashBalance: number;
  receivables: number;
  receivableCount: number;
  pendingCount: number;
  monthNetProfit: number;
  monthExpensesTotal: number;
  todayExpensesTotal: number;
};

type LedgerEntry = {
  id: string;
  date: string;
  type: "SALE" | "COMMISSION" | "EXPENSE";
  label: string;
  amount: number;
  link: string | null;
};

export default function FinancePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/finance/overview").then((r) => r.json()).then(setOverview);
    fetch("/api/admin/finance/ledger?range=month")
      .then((r) => r.json())
      .then((d) => setRecent((d.entries ?? []).slice(0, 8)));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Finance</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Cash, receivables, expenses, and profitability at a glance.
      </p>
      <FinanceTabs />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 rounded-xl3 bg-ink p-6 text-white shadow-soft">
          <Wallet size={18} className="text-gold" />
          <p className="mt-3 font-body text-xs uppercase tracking-wide text-white/50">Cash on Hand</p>
          <p className="mt-1 font-display text-2xl text-gold">
            {overview ? formatDzd(overview.cashBalance) : "—"}
          </p>
          <p className="mt-1 font-body text-[11px] text-white/40">Collected on delivery</p>
        </div>

        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <Clock size={18} className="text-ink/40" />
          <p className="mt-3 font-body text-xs uppercase tracking-wide text-ink/50">Receivables</p>
          <p className="mt-1 font-display text-2xl text-ink">
            {overview ? formatDzd(overview.receivables) : "—"}
          </p>
          <p className="mt-1 font-body text-[11px] text-ink/40">
            {overview ? `${overview.receivableCount} orders in transit` : ""}
          </p>
        </div>

        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <TrendingUp size={18} className="text-emerald-600" />
          <p className="mt-3 font-body text-xs uppercase tracking-wide text-ink/50">This Month Net Profit</p>
          <p className={`mt-1 font-display text-2xl ${overview && overview.monthNetProfit < 0 ? "text-red-600" : "text-ink"}`}>
            {overview ? formatDzd(overview.monthNetProfit) : "—"}
          </p>
          <Link href="/admin/finance/pnl" className="mt-1 inline-flex items-center gap-1 font-body text-[11px] text-ink/40 hover:text-ink">
            View P&L <ArrowRight size={11} />
          </Link>
        </div>

        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <Receipt size={18} className="text-ink/40" />
          <p className="mt-3 font-body text-xs uppercase tracking-wide text-ink/50">This Month Expenses</p>
          <p className="mt-1 font-display text-2xl text-ink">
            {overview ? formatDzd(overview.monthExpensesTotal) : "—"}
          </p>
          <p className="mt-1 font-body text-[11px] text-ink/40">
            {overview ? `${formatDzd(overview.todayExpensesTotal)} today` : ""}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent Activity</h2>
          <Link href="/admin/finance/ledger" className="font-body text-xs text-ink/50 hover:text-ink">
            View full ledger
          </Link>
        </div>
        {recent.length === 0 && (
          <p className="mt-6 font-body text-sm text-ink/40">No transactions yet this month.</p>
        )}
        <ul className="mt-4 divide-y divide-line">
          {recent.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-3">
              <div>
                {e.link ? (
                  <Link href={e.link} className="font-body text-sm text-ink hover:text-gold">
                    {e.label}
                  </Link>
                ) : (
                  <span className="font-body text-sm text-ink">{e.label}</span>
                )}
                <p className="font-body text-[11px] text-ink/40">
                  {new Date(e.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`font-body text-sm ${e.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {e.amount < 0 ? "−" : "+"}
                {formatDzd(Math.abs(e.amount))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
