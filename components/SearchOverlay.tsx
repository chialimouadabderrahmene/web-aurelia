"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search as SearchIcon } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/config";

type Result = { slug: string; nameEn: string; nameAr: string; price: number; image: string | null };

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, dict } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else {
      setQ("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/public/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.products ?? []))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  function goToResults() {
    if (q.trim().length < 2) return;
    router.push(`${localizedPath(locale, "/search")}?q=${encodeURIComponent(q)}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-0 max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-white shadow-lift md:mt-20 md:rounded-xl3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line p-5">
              <SearchIcon size={18} className="text-ink/40" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToResults()}
                placeholder={dict.nav.search}
                className="flex-1 bg-transparent font-body text-base text-ink outline-none placeholder:text-ink/40"
              />
              <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {loading && <p className="font-body text-sm text-ink/40">…</p>}
              {!loading && q.trim().length >= 2 && results.length === 0 && (
                <p className="font-body text-sm text-ink/40">
                  {locale === "ar" ? "لا توجد نتائج" : "No results found"}
                </p>
              )}
              <div className="space-y-1">
                {results.map((r) => (
                  <a
                    key={r.slug}
                    href={`${localizedPath(locale, `/product/${r.slug}`)}`}
                    onClick={onClose}
                    className="flex items-center gap-4 rounded-xl2 p-2 hover:bg-sand"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl2 bg-sand">
                      {r.image && <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm text-ink">{locale === "ar" ? r.nameAr : r.nameEn}</p>
                      <p className="font-body text-xs text-ink/50">{formatDzd(r.price)}</p>
                    </div>
                  </a>
                ))}
              </div>
              {results.length > 0 && (
                <button
                  onClick={goToResults}
                  className="mt-3 w-full rounded-xl2 py-3 text-center font-body text-xs uppercase tracking-widest2 text-ink/60 hover:bg-sand hover:text-ink"
                >
                  {locale === "ar" ? "عرض جميع النتائج" : "View all results"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
