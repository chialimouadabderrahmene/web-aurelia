"use client";

import { useEffect, useState } from "react";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";
import TrendChart from "@/components/admin/TrendChart";

type Pnl = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  deliveryCollected: number;
  commissions: number;
  commissionOrders: number;
  commissionRate: number;
  expensesByCategory: { category: string; label: string; total: number }[];
  expensesTotal: number;
  netProfit: number;
  netMargin: number;
  orderCount: number;
  monthlyTrend: { label: string; value?: number; revenue: number; netProfit: number }[];
};

const RANGES = [
  { key: "month", label: "This Month" },
  { key: "week", label: "7 Days" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

function Row({ label, value, bold, indent, negative }: { label: string; value: number; bold?: boolean; indent?: boolean; negative?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${bold ? "border-t border-line pt-3 font-medium" : ""}`}>
      <span className={`font-body text-sm text-ink ${indent ? "pl-4 text-ink/60" : ""}`}>{label}</span>
      <span className={`font-body text-sm ${negative ? "text-red-600" : "text-ink"}`}>
        {negative && value !== 0 ? "−" : ""}
        {formatDzd(Math.abs(value))}
      </span>
    </div>
  );
}

export default function PnlPage() {
  const [range, setRange] = useState("month");
  const [pnl, setPnl] = useState<Pnl | null>(null);

  useEffect(() => {
    fetch(`/api/admin/finance/pnl?range=${range}`)
      .then((r) => r.json())
      .then(setPnl);
  }, [range]);

  const revenueTrend = pnl?.monthlyTrend.map((m) => ({ label: m.label, value: m.revenue })) ?? [];
  const profitTrend = pnl?.monthlyTrend.map((m) => ({ label: m.label, value: m.netProfit })) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">P&L Statement</h1>
          <p className="mt-1 font-body text-sm text-ink/50">Income statement — revenue to net profit.</p>
        </div>
      </div>
      <FinanceTabs />

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

      {pnl && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <p className="font-body text-xs uppercase tracking-wide text-ink/50">Gross Margin</p>
              <p className="mt-1 font-display text-2xl text-ink">{pnl.grossMargin}%</p>
              <p className="mt-1 font-body text-[11px] text-ink/40">{pnl.orderCount} orders</p>
            </div>
            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <p className="font-body text-xs uppercase tracking-wide text-ink/50">Net Margin</p>
              <p className={`mt-1 font-display text-2xl ${pnl.netMargin < 0 ? "text-red-600" : "text-ink"}`}>{pnl.netMargin}%</p>
            </div>
            <div className="min-w-0 rounded-xl3 bg-ink p-6 text-white shadow-soft">
              <p className="font-body text-xs uppercase tracking-wide text-white/50">Net Profit</p>
              <p className="mt-1 font-display text-2xl text-gold">{formatDzd(pnl.netProfit)}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <h3 className="font-display text-base text-ink">Revenue Trend — 6 Months</h3>
              <div className="mt-4">
                <TrendChart points={revenueTrend} color="#B8935F" />
              </div>
            </div>
            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <h3 className="font-display text-base text-ink">Net Profit Trend — 6 Months</h3>
              <div className="mt-4">
                <TrendChart points={profitTrend} color="#111111" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <h3 className="font-display text-base text-ink">Income Statement</h3>
              <div className="mt-3 divide-y divide-line/60">
                <Row label="Product Revenue" value={pnl.revenue} />
                <Row label="Cost of Goods Sold" value={pnl.cogs} indent negative />
                <Row label="Gross Profit" value={pnl.grossProfit} bold />
                <Row label={`Agent Commissions (${pnl.commissionOrders} × ${formatDzd(pnl.commissionRate)})`} value={pnl.commissions} indent negative />
                <Row label="Operating Expenses" value={pnl.expensesTotal} indent negative />
                <Row label="Net Profit" value={pnl.netProfit} bold negative={pnl.netProfit < 0} />
              </div>
              <p className="mt-4 font-body text-[11px] text-ink/40">
                Delivery fees collected ({formatDzd(pnl.deliveryCollected)}) are pass-through to courier and excluded from profit.
              </p>
            </div>

            <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <h3 className="font-display text-base text-ink">Expenses by Category</h3>
              {pnl.expensesByCategory.length === 0 && (
                <p className="mt-6 font-body text-sm text-ink/40">No expenses recorded in this period.</p>
              )}
              <div className="mt-4 space-y-3">
                {pnl.expensesByCategory.map((c) => {
                  const pct = pnl.expensesTotal > 0 ? Math.round((c.total / pnl.expensesTotal) * 100) : 0;
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between font-body text-sm">
                        <span className="text-ink">{c.label}</span>
                        <span className="text-ink/60">{formatDzd(c.total)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
