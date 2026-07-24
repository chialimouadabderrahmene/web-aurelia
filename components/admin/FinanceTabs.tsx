"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/finance", label: "Overview" },
  { href: "/admin/finance/pnl", label: "P&L Statement" },
  { href: "/admin/finance/expenses", label: "Expenses" },
  { href: "/admin/finance/ledger", label: "Ledger" },
  { href: "/admin/finance/products", label: "Product Costs" },
  { href: "/admin/finance/delivery-prices", label: "Delivery Prices" },
  { href: "/admin/finance/forecast", label: "Forecast" },
];

export default function FinanceTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = tab.href === "/admin/finance" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-4 py-3 font-body text-sm transition-colors ${
              active ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
