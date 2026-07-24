"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import { useWishlist } from "@/lib/store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import BagIllustration from "./BagIllustration";
import TiltCard from "./TiltCard";

const variantByCategory: Record<string, "tote" | "shoulder" | "clutch" | "crossbody"> = {
  TOTE: "tote",
  SHOULDER_BAG: "shoulder",
  CLUTCH: "clutch",
  CROSSBODY: "crossbody",
  TOP_HANDLE: "shoulder",
  WEEKENDER: "tote",
};

export type CardProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stockQty: number;
  isNew: boolean;
  colors: { nameEn: string; nameAr: string; hex: string }[];
  images: { url: string }[];
  flashDiscountPercent?: number | null;
  effectivePrice?: number;
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const saved = useWishlist((s) => s.has(product.slug));
  const toggle = useWishlist((s) => s.toggle);
  const { locale, dict } = useLocale();
  const variant = variantByCategory[product.category] ?? "shoulder";
  const cover = product.images[0]?.url;
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const onSale = !!product.flashDiscountPercent;
  const displayPrice = product.effectivePrice ?? product.price;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <LocalizedLink href={`/product/${product.slug}`}>
        <TiltCard max={6} className="aspect-[4/5] overflow-hidden rounded-xl3 bg-sand [transform-style:preserve-3d]">
          {cover ? (
            <Image
              src={cover}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.04]"
            />
          ) : (
            <BagIllustration
              hex={product.colors[0]?.hex ?? "#EDE3D0"}
              variant={variant}
              className="h-full w-full transition-transform duration-700 ease-premium group-hover:scale-[1.04]"
            />
          )}
          {onSale ? (
            <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 font-body text-[10px] uppercase tracking-widest2 text-white">
              -{product.flashDiscountPercent}%
            </span>
          ) : (
            product.isNew && (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-body text-[10px] uppercase tracking-widest2 text-ink">
                New
              </span>
            )
          )}
          {product.stockQty <= 0 && (
            <span className="absolute left-4 bottom-4 rounded-full bg-ink/85 px-3 py-1 font-body text-[10px] uppercase tracking-widest2 text-white">
              {dict.common.preorder}
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.slug);
            }}
            aria-label="Toggle wishlist"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition-transform hover:scale-110"
          >
            <Heart
              size={16}
              strokeWidth={1.5}
              fill={saved ? "#B8935F" : "none"}
              color={saved ? "#B8935F" : "#111111"}
            />
          </button>
        </TiltCard>
      </LocalizedLink>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <LocalizedLink href={`/product/${product.slug}`}>
            <h3 className="font-display text-lg text-ink">{name}</h3>
          </LocalizedLink>
          <p className="font-body text-xs uppercase tracking-wide text-ink/50">
            {dict.categories[product.category as keyof typeof dict.categories]}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-body text-sm ${onSale ? "text-red-600" : "text-ink"}`}>
            {formatDzd(displayPrice)}
          </p>
          {(onSale || product.compareAtPrice) && (
            <p className="font-body text-xs text-ink/40 line-through">
              {formatDzd(onSale ? product.price : product.compareAtPrice!)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        {product.colors.map((c) => (
          <span
            key={c.nameEn}
            title={locale === "ar" ? c.nameAr : c.nameEn}
            className="h-3.5 w-3.5 rounded-full border border-ink/10"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </motion.div>
  );
}
