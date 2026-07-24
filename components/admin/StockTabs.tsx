"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/stock", label: "Levels" },
  { href: "/admin/stock/movements", label: "Movement Log" },
];

export default function StockTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
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
