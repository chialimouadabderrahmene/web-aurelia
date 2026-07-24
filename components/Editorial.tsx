"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Reveal from "./Reveal";

export default function Editorial({ image }: { image: string | null }) {
  const { dict } = useLocale();

  return (
    <section className="container-aurelia py-24 md:py-32">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl3 bg-ink">
            {image && <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="eyebrow">{dict.editorial.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            {dict.editorial.title}
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/60">
            {dict.editorial.body}
          </p>
          <LocalizedLink href="/about" className="btn-secondary mt-8 inline-flex">
            {dict.editorial.cta}
          </LocalizedLink>
        </Reveal>
      </div>
    </section>
  );
}
