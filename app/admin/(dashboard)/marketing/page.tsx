import Link from "next/link";
import { Ticket, Gift, Zap, Package2, ShoppingCart, Users2 } from "lucide-react";

const sections = [
  { href: "/admin/marketing/coupons", label: "Coupons", desc: "Percentage or fixed discount codes", icon: Ticket },
  { href: "/admin/marketing/gift-cards", label: "Gift Cards", desc: "Prepaid balance codes", icon: Gift },
  { href: "/admin/marketing/flash-sales", label: "Flash Sales", desc: "Time-boxed product discounts", icon: Zap },
  { href: "/admin/marketing/bundles", label: "Bundles", desc: "Multi-product discounted sets", icon: Package2 },
  { href: "/admin/marketing/abandoned-carts", label: "Abandoned Carts", desc: "Carts left without an order", icon: ShoppingCart },
  { href: "/admin/marketing/affiliates", label: "Affiliates & Referrals", desc: "Commission partners and referral tracking", icon: Users2 },
];

export default function MarketingHubPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Marketing</h1>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft transition-shadow hover:shadow-card"
          >
            <s.icon size={20} strokeWidth={1.5} className="text-gold" />
            <p className="mt-4 font-display text-lg text-ink">{s.label}</p>
            <p className="mt-1 font-body text-sm text-ink/50">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
