"use client";

import { formatDzd } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function StickyBuyBar({ price, targetId }: { price: number; targetId: string }) {
  const { dict } = useLocale();

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() =>
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="flex w-full items-center justify-between rounded-xl3 bg-ink px-6 py-4 text-white transition-transform active:scale-[0.98]"
      >
        <span className="font-body text-[15px] font-medium">{dict.stickyBar.cta}</span>
        <span className="font-display text-lg">{formatDzd(price)}</span>
      </button>
    </div>
  );
}
