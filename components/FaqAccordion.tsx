"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-12 max-w-2xl divide-y divide-line">
      {items.map((item, i) => (
        <div key={i} className="py-5">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-display text-lg text-ink">{item.q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={18} className="text-ink/50" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pt-3 font-body text-sm leading-relaxed text-ink/60">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
