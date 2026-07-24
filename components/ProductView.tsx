"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw, MapPin } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import { useWishlist } from "@/lib/store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import BagIllustration from "./BagIllustration";
import TiltCard from "./TiltCard";
import BuyNowForm from "./BuyNowForm";

const variantByCategory: Record<string, "tote" | "shoulder" | "clutch" | "crossbody"> = {
  TOTE: "tote",
  SHOULDER_BAG: "shoulder",
  CLUTCH: "clutch",
  CROSSBODY: "crossbody",
  TOP_HANDLE: "shoulder",
  WEEKENDER: "tote",
};

export type ViewProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  materialsEn: string;
  materialsAr: string;
  dimensions: string;
  careEn: string;
  careAr: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  originCountry: string;
  stockQty: number;
  colors: { nameEn: string; nameAr: string; hex: string }[];
  images: { url: string }[];
  flashDiscountPercent?: number | null;
  effectivePrice?: number;
};

export default function ProductView({ product }: { product: ViewProduct }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const { locale, dict } = useLocale();
  const [trust, setTrust] = useState<{ delivery: string; cod: string; returns: string } | null>(null);

  useEffect(() => {
    fetch("/api/public/site-content")
      .then((r) => r.json())
      .then((d) => {
        const c = d.content;
        setTrust(
          locale === "ar"
            ? { delivery: c.trustDeliveryAr, cod: c.trustCodAr, returns: c.trustReturnsAr }
            : { delivery: c.trustDeliveryEn, cod: c.trustCodEn, returns: c.trustReturnsEn }
        );
      });
  }, [locale]);
  const tabs = [
    dict.product.descriptionTab,
    dict.product.materialsTab,
    dict.product.dimensionsTab,
    dict.product.careTab,
  ] as const;
  const [tab, setTab] = useState<string>(tabs[0]);
  const saved = useWishlist((s) => s.has(product.slug));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const variant = variantByCategory[product.category] ?? "shoulder";
  const color = product.colors[colorIdx];
  const preorder = product.stockQty <= 0;
  const isAr = locale === "ar";
  const onSale = !!product.flashDiscountPercent;
  const unitPrice = product.effectivePrice ?? product.price;

  const name = isAr ? product.nameAr : product.nameEn;
  const colorName = color ? (isAr ? color.nameAr : color.nameEn) : "";

  const tabContent: Record<string, string> = {
    [dict.product.descriptionTab]: isAr ? product.descriptionAr : product.descriptionEn,
    [dict.product.materialsTab]: isAr ? product.materialsAr : product.materialsEn,
    [dict.product.dimensionsTab]: product.dimensions,
    [dict.product.careTab]: isAr ? product.careAr : product.careEn,
  };

  return (
    <div className="container-aurelia pt-6 md:pt-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <TiltCard max={8} className="aspect-square overflow-hidden rounded-xl3 bg-sand md:sticky md:top-24">
            {product.images.length > 0 ? (
              <Image
                src={product.images[imgIdx]?.url ?? product.images[0].url}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <BagIllustration hex={color?.hex ?? "#EDE3D0"} variant={variant} className="h-full w-full" />
            )}
          </TiltCard>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setImgIdx(i)}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl2 border-2 ${
                    i === imgIdx ? "border-gold" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div>
          <p className="eyebrow">{dict.categories[product.category as keyof typeof dict.categories]}</p>
          <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">{name}</h1>

          <div className="mt-3 flex items-center gap-1.5 font-body text-xs text-ink/50">
            <MapPin size={13} strokeWidth={1.5} />
            {dict.product.origin} {product.originCountry}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className={`font-body text-xl ${onSale ? "text-red-600" : "text-ink"}`}>
              {formatDzd(unitPrice)}
            </span>
            {(onSale || product.compareAtPrice) && (
              <span className="font-body text-sm text-ink/40 line-through">
                {formatDzd(onSale ? product.price : product.compareAtPrice!)}
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-red-600 px-2.5 py-1 font-body text-[10px] uppercase text-white">
                -{product.flashDiscountPercent}%
              </span>
            )}
          </div>
          <p className="mt-1 font-body text-xs text-ink/50">
            {isAr ? "أو" : "or"} 3x {formatDzd(Math.round(unitPrice / 3))} — {dict.product.installments}
          </p>

          {preorder && (
            <p className="mt-3 inline-flex items-center rounded-full bg-amber-50 px-4 py-1.5 font-body text-xs text-amber-700">
              {dict.product.preorderNote}
            </p>
          )}

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div className="mt-8">
              <p className="font-body text-sm text-ink/70">
                {dict.common.color} — <span className="text-ink">{colorName}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c, i) => (
                  <button
                    key={c.nameEn}
                    onClick={() => setColorIdx(i)}
                    aria-label={c.nameEn}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${
                      i === colorIdx ? "border-gold scale-110" : "border-transparent"
                    }`}
                  >
                    <span
                      className="block h-full w-full rounded-full border border-ink/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-8 flex items-center gap-4">
            <p className="font-body text-sm text-ink/70">{dict.common.quantity}</p>
            <div className="flex items-center gap-4 rounded-full border border-line px-3 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-6 w-6 items-center justify-center text-ink/60 hover:text-ink"
              >
                <Minus size={14} />
              </button>
              <span className="w-4 text-center font-body text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-6 w-6 items-center justify-center text-ink/60 hover:text-ink"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Wishlist */}
          <div className="mt-9 hidden md:flex">
            <button
              onClick={() => toggleWishlist(product.slug)}
              aria-label="Toggle wishlist"
              className="flex items-center gap-2 rounded-xl3 border border-ink/15 px-5 py-3.5 hover:border-ink"
            >
              <Heart size={18} fill={saved ? "#B8935F" : "none"} color={saved ? "#B8935F" : "#111"} />
              <span className="font-body text-sm text-ink/70">{isAr ? "أضف للمفضلة" : "Save to wishlist"}</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-9 grid grid-cols-1 gap-3 rounded-xl2 bg-sand p-5 sm:grid-cols-3">
            <TrustItem icon={Truck} label={trust?.delivery ?? dict.product.trustDelivery} />
            <TrustItem icon={ShieldCheck} label={trust?.cod ?? dict.product.trustCod} />
            <TrustItem icon={RotateCcw} label={trust?.returns ?? dict.product.trustReturns} />
          </div>

          {/* Buy Now — direct checkout */}
          <div className="mt-9">
            <BuyNowForm
              slug={product.slug}
              productName={product.nameEn}
              unitPrice={unitPrice}
              color={color?.nameEn ?? ""}
              colorHex={color?.hex ?? "#EDE3D0"}
              qty={qty}
            />
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex gap-6 border-b border-line">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-4 font-body text-sm transition-colors ${
                    tab === t ? "text-ink" : "text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {t}
                  {tab === t && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute -bottom-px left-0 right-0 h-px bg-ink"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-6 max-w-lg font-body text-sm leading-relaxed text-ink/60">
              {tabContent[tab]}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof Truck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={16} strokeWidth={1.5} className="shrink-0 text-gold" />
      <span className="font-body text-xs text-ink/70">{label}</span>
    </div>
  );
}
