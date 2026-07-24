"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";

export default function Hero({ videoUrl }: { videoUrl: string }) {
  const { dict } = useLocale();

  return (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden bg-ink md:min-h-[94vh]">
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="container-aurelia relative z-10 pb-16 pt-32 md:pb-24"
      >
        <p className="eyebrow mb-5 text-white/60">{dict.hero.eyebrow}</p>
        <h1 className="font-display text-[15vw] leading-[0.95] text-white md:text-[5.2vw]">
          {dict.hero.title}
        </h1>
        <p className="mt-6 max-w-sm font-body text-base leading-relaxed text-white/70">
          {dict.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <LocalizedLink href="/collection" className="btn-primary">
            {dict.hero.shopCollection}
          </LocalizedLink>
          <LocalizedLink
            href="/about"
            className="inline-flex items-center justify-center rounded-xl3 border border-white/30 bg-transparent px-8 py-4 font-body text-[13px] font-medium uppercase tracking-widest2 text-white transition-all duration-500 ease-premium hover:border-white active:scale-[0.98]"
          >
            {dict.hero.ourStory}
          </LocalizedLink>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block"
      >
        <div className="h-9 w-6 rounded-full border border-white/30 p-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        </div>
      </motion.div>
    </section>
  );
}
