"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/purchasing", label: "Purchase Orders" },
  { href: "/admin/purchasing/suppliers", label: "Suppliers" },
];

export default function PurchasingTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = tab.href === "/admin/purchasing" ? pathname === tab.href : pathname.startsWith(tab.href);
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
