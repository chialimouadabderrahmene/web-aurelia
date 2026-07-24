"use client";

import { usePathname } from "next/navigation";
import { Home, Grid2x2, Heart, ShoppingBag, User } from "lucide-react";
import { useCart, useWishlist } from "@/lib/store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";

export default function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishlistCount = useWishlist((s) => s.slugs.length);
  const { locale, dict } = useLocale();

  const items = [
    { href: "/", label: dict.bottomNav.home, icon: Home },
    { href: "/collection", label: dict.bottomNav.shop, icon: Grid2x2 },
    { href: "/wishlist", label: dict.bottomNav.saved, icon: Heart },
    { href: "/cart", label: dict.bottomNav.bag, icon: ShoppingBag },
    { href: "/account", label: dict.bottomNav.account, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === `/${locale}${href === "/" ? "" : href}`;
          const count =
            href === "/cart" ? cartCount : href === "/wishlist" ? wishlistCount : 0;
          return (
            <LocalizedLink
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-3"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                className={active ? "text-ink" : "text-ink/40"}
              />
              <span
                className={`text-[10px] font-body tracking-wide ${
                  active ? "text-ink font-medium" : "text-ink/40"
                }`}
              >
                {label}
              </span>
              {count > 0 && (
                <span className="absolute top-1 right-[22%] h-4 w-4 rounded-full bg-gold text-[9px] font-body text-white flex items-center justify-center">
                  {count}
                </span>
              )}
              {active && (
                <span className="absolute -top-px left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-gold" />
              )}
            </LocalizedLink>
          );
        })}
      </div>
    </nav>
  );
}
