"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import ProductCard, { CardProduct } from "./ProductCard";
import Reveal from "./Reveal";

export default function CollectionGrid({
  products,
  bestSellerSlugs,
  newSlugs,
}: {
  products: CardProduct[];
  bestSellerSlugs: string[];
  newSlugs: string[];
}) {
  const [active, setActive] = useState("all");
  const { dict } = useLocale();

  const filters = [
    { key: "all", label: dict.collectionPage.filterAll },
    { key: "best-sellers", label: dict.collectionPage.filterBestSellers },
    { key: "new", label: dict.collectionPage.filterNew },
  ];

  const list = useMemo(() => {
    if (active === "best-sellers") return products.filter((p) => bestSellerSlugs.includes(p.slug));
    if (active === "new") return products.filter((p) => newSlugs.includes(p.slug));
    return products;
  }, [active, products, bestSellerSlugs, newSlugs]);

  return (
    <>
      <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`whitespace-nowrap rounded-full border px-5 py-2.5 font-body text-[13px] uppercase tracking-wide transition-colors ${
              active === f.key
                ? "border-ink bg-ink text-white"
                : "border-line text-ink/60 hover:border-ink/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center font-body text-sm text-ink/40">{dict.collectionPage.empty}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
          {list.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i * 0.06, 0.3)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
