"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Search, Heart, ShoppingBag } from "lucide-react";
import { useCart, useWishlist } from "@/lib/store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

const SearchOverlay = dynamic(() => import("@/components/SearchOverlay"), { ssr: false });

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishlistCount = useWishlist((s) => s.slugs.length);
  const openCart = useCart((s) => s.open);
  const { dict } = useLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 w-full transition-all duration-500 ease-premium ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="container-aurelia flex h-[76px] items-center justify-between">
        <LocalizedLink
          href="/"
          className="font-display text-2xl tracking-widest2 text-ink"
        >
          AURELIA
        </LocalizedLink>

        <nav className="hidden md:flex items-center gap-9 font-body text-[13px] uppercase tracking-widest2 text-ink/70">
          <LocalizedLink href="/collection" className="hover:text-ink transition-colors">
            {dict.nav.collection}
          </LocalizedLink>
          <LocalizedLink href="/about" className="hover:text-ink transition-colors">
            {dict.nav.about}
          </LocalizedLink>
          <LocalizedLink href="/reviews" className="hover:text-ink transition-colors">
            {dict.nav.reviews}
          </LocalizedLink>
          <LocalizedLink href="/faq" className="hover:text-ink transition-colors">
            {dict.nav.faq}
          </LocalizedLink>
          <LocalizedLink href="/contact" className="hover:text-ink transition-colors">
            {dict.nav.contact}
          </LocalizedLink>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher className="hidden md:flex mr-1" />
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={dict.nav.search}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-sand hover:text-ink"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
          <LocalizedLink
            href="/wishlist"
            aria-label={dict.nav.wishlist}
            className="relative hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-sand hover:text-ink"
          >
            <Heart size={18} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gold text-[9px] font-body text-white flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </LocalizedLink>
          <button
            onClick={openCart}
            aria-label={dict.nav.cart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-sand hover:text-ink"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gold text-[9px] font-body text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
}
