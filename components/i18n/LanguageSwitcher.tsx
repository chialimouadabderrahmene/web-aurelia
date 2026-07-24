"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import { locales } from "@/lib/i18n/config";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || "/");
  }

  return (
    <div className={`flex items-center gap-1 rounded-full border border-line p-0.5 ${className}`}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`rounded-full px-2.5 py-1 font-body text-[11px] uppercase tracking-wide transition-colors ${
            l === locale ? "bg-ink text-white" : "text-ink/50 hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
