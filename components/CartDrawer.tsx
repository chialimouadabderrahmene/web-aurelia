"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatDzd } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import BagIllustration from "./BagIllustration";

export default function CartDrawer() {
  const { isOpen, close, items, remove, setQty } = useCart();
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const { dict, locale } = useLocale();
  const offscreen = locale === "ar" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-lift ltr:right-0 rtl:left-0"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h3 className="font-display text-xl text-ink">
                {dict.cart.title} ({items.length})
              </h3>
              <button
                onClick={close}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-sand"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="font-body text-sm text-ink/50">{dict.cartDrawer.empty}</p>
                  <LocalizedLink href="/collection" onClick={close} className="btn-secondary">
                    {dict.common.shopCollection}
                  </LocalizedLink>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li key={item.slug + item.color} className="flex gap-4">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl2 bg-sand">
                        <BagIllustration hex={item.colorHex} className="h-full w-full" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-display text-base text-ink">{item.name}</p>
                            <p className="font-body text-xs text-ink/50">{item.color}</p>
                          </div>
                          <button
                            onClick={() => remove(item.slug, item.color)}
                            className="font-body text-xs text-ink/40 hover:text-ink"
                          >
                            {dict.common.remove}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
                            <button
                              onClick={() =>
                                setQty(item.slug, item.color, Math.max(1, item.qty - 1))
                              }
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
                          <p className="font-body text-sm text-ink">
                            {formatDzd(item.price * item.qty)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-line px-6 py-6">
                <div className="mb-4 flex items-center justify-between font-body text-sm text-ink">
                  <span>{dict.common.subtotal}</span>
                  <span className="text-base">{formatDzd(total)}</span>
                </div>
                <LocalizedLink href="/checkout" onClick={close} className="btn-primary w-full">
                  {dict.cart.checkout}
                </LocalizedLink>
                <p className="mt-3 text-center font-body text-xs text-ink/40">{dict.footer.cod}</p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
