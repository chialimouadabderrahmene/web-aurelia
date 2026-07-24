"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Boxes, Users, Contact, Megaphone, Wallet, HandCoins, Plug, Truck, FileBarChart, ShieldCheck, FileText } from "lucide-react";
import { SessionPayload } from "@/lib/auth";

const icons: Record<string, typeof LayoutDashboard> = {
  "/admin": LayoutDashboard,
  "/admin/orders": ShoppingBag,
  "/admin/customers": Contact,
  "/admin/products": Package,
  "/admin/stock": Boxes,
  "/admin/purchasing": Truck,
  "/admin/marketing": Megaphone,
  "/admin/content": FileText,
  "/admin/finance": Wallet,
  "/admin/reports": FileBarChart,
  "/admin/earnings": HandCoins,
  "/admin/integrations": Plug,
  "/admin/users": Users,
  "/admin/audit-log": ShieldCheck,
};

export default function AdminSidebar({
  nav,
  session,
}: {
  nav: { href: string; label: string; area: string | null }[];
  session: SessionPayload;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-white md:flex md:flex-col">
      <div className="px-6 py-7">
        <p className="font-display text-2xl tracking-widest2 text-ink">AURELIA</p>
        <p className="mt-0.5 font-body text-[11px] uppercase tracking-widest2 text-ink/40">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = icons[item.href] ?? LayoutDashboard;
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl2 px-4 py-3 font-body text-sm transition-colors ${
                active ? "bg-ink text-white" : "text-ink/60 hover:bg-sand"
              }`}
            >
              <Icon size={17} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-6 py-5">
        <p className="font-body text-sm text-ink">{session.name}</p>
        <p className="font-body text-xs text-ink/40">{roleLabel(session.role)}</p>
      </div>
    </aside>
  );
}

function roleLabel(role: string) {
  if (role === "OWNER") return "Owner";
  if (role === "CONFIRMATION_AGENT") return "Confirmation Agent";
  if (role === "STOCK_MANAGER") return "Stock Manager";
  if (role === "FINANCE_MANAGER") return "Finance Manager";
  return role;
}
