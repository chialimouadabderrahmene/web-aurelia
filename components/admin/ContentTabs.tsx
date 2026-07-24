"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/content", label: "About & Messages" },
  { href: "/admin/content/faq", label: "FAQ" },
  { href: "/admin/content/reviews", label: "Reviews" },
];

export default function ContentTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = tab.href === "/admin/content" ? pathname === tab.href : pathname.startsWith(tab.href);
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
