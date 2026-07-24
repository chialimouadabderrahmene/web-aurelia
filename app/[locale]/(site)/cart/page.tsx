"use client";

import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatDzd } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import BagIllustration from "@/components/BagIllustration";
import Reveal from "@/components/Reveal";

export default function CartPage() {
  const { items, remove, setQty } = useCart();
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const { dict } = useLocale();

  if (items.length === 0) {
    return (
      <div className="container-aurelia flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="h-32 w-32 opacity-40">
          <BagIllustration hex="#E7E2D9" className="h-full w-full" />
        </div>
        <h1 className="font-display text-3xl text-ink">{dict.cart.empty}</h1>
        <p className="max-w-xs font-body text-sm text-ink/50">{dict.cart.emptySubtitle}</p>
        <LocalizedLink href="/collection" className="btn-primary mt-2">
          {dict.common.shopCollection}
        </LocalizedLink>
      </div>
    );
  }

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <h1 className="font-display text-4xl text-ink md:text-5xl">{dict.cart.title}</h1>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3">
        <ul className="space-y-6 md:col-span-2">
          {items.map((item) => (
            <li
              key={item.slug + item.color}
              className="flex gap-5 rounded-xl3 bg-white p-4 shadow-soft"
            >
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl2 bg-sand">
                <BagIllustration hex={item.colorHex} className="h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{item.name}</p>
                    <p className="font-body text-xs text-ink/50">{item.color}</p>
                  </div>
                  <button
                    onClick={() => remove(item.slug, item.color)}
                    className="text-ink/30 hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-full border border-line px-3 py-1.5">
                    <button
                      onClick={() => setQty(item.slug, item.color, Math.max(1, item.qty - 1))}
                      className="flex h-6 w-6 items-center justify-center text-ink/60 hover:text-ink"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center font-body text-xs">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.slug, item.color, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center text-ink/60 hover:text-ink"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="font-body text-base text-ink">
                    {formatDzd(item.price * item.qty)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-xl3 bg-sand p-7">
          <h2 className="font-display text-xl text-ink">{dict.cart.summary}</h2>
          <div className="mt-5 space-y-3 font-body text-sm text-ink/70">
            <div className="flex justify-between">
              <span>{dict.common.subtotal}</span>
              <span>{formatDzd(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>{dict.common.shipping}</span>
              <span>{dict.cart.shippingCalculated}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 font-body text-base text-ink">
            <span>{dict.common.total}</span>
            <span>{formatDzd(total)}</span>
          </div>
          <LocalizedLink href="/checkout" className="btn-primary mt-6 w-full">
            {dict.cart.checkout}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
