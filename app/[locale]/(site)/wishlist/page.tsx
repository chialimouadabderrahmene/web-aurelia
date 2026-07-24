"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import ProductCard, { CardProduct } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import BagIllustration from "@/components/BagIllustration";

export default function WishlistPage() {
  const slugs = useWishlist((s) => s.slugs);
  const [products, setProducts] = useState<CardProduct[]>([]);
  const { dict } = useLocale();

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  const saved = products.filter((p) => slugs.includes(p.slug));

  if (saved.length === 0) {
    return (
      <div className="container-aurelia flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="h-32 w-32 opacity-40">
          <BagIllustration hex="#E7E2D9" className="h-full w-full" />
        </div>
        <h1 className="font-display text-3xl text-ink">{dict.wishlist.empty}</h1>
        <p className="max-w-xs font-body text-sm text-ink/50">{dict.wishlist.emptySubtitle}</p>
        <LocalizedLink href="/collection" className="btn-primary mt-2">
          {dict.common.shopCollection}
        </LocalizedLink>
      </div>
    );
  }

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <h1 className="font-display text-4xl text-ink md:text-5xl">{dict.wishlist.title}</h1>
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
        {saved.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.08}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
