"use client";

import { useState } from "react";
import { Download, ShoppingBag, Receipt, Boxes, Truck, FileBarChart } from "lucide-react";

const RANGES = [
  { key: "month", label: "This Month" },
  { key: "week", label: "7 Days" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

const REPORTS = [
  { key: "orders", label: "Orders", desc: "Every order with status, customer, and totals.", icon: ShoppingBag, ranged: true },
  { key: "pnl", label: "P&L Statement", desc: "Revenue, COGS, commissions, expenses, net profit.", icon: FileBarChart, ranged: true },
  { key: "expenses", label: "Expenses", desc: "All recorded expenses by category.", icon: Receipt, ranged: true },
  { key: "stock", label: "Stock Levels", desc: "Current inventory for every product.", icon: Boxes, ranged: false },
  { key: "purchase-orders", label: "Purchase Orders", desc: "All supplier purchase orders and totals.", icon: Truck, ranged: false },
];

export default function ReportsPage() {
  const [range, setRange] = useState("month");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Reports</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Export your business data as CSV for accounting, taxes, or backup.
      </p>

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

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const href = `/api/admin/reports/${r.key}${r.ranged ? `?range=${range}` : ""}`;
          return (
            <div key={r.key} className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
              <Icon size={20} className="text-gold" />
              <p className="mt-3 font-display text-lg text-ink">{r.label}</p>
              <p className="mt-1 font-body text-sm text-ink/50">{r.desc}</p>
              <a href={href} className="btn-secondary mt-4 inline-flex !px-4 !py-2.5 text-xs">
                <Download size={14} className="mr-1.5" /> Download CSV
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
