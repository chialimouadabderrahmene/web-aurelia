"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n/LocaleProvider";
import Reveal from "./Reveal";

export default function InstagramGrid({ images }: { images: string[] }) {
  const { dict } = useLocale();

  if (images.length === 0) return null;

  return (
    <section className="container-aurelia py-24 md:py-32">
      <Reveal className="text-center">
        <p className="eyebrow">{dict.instagram.eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {dict.instagram.title}
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
        {images.map((url, i) => (
          <Reveal key={url + i} delay={i * 0.06}>
            <div className="relative aspect-square overflow-hidden rounded-xl2 bg-sand transition-transform duration-500 hover:scale-[1.03]">
              <Image src={url} alt="" fill sizes="(max-width: 768px) 33vw, 16vw" className="object-cover" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
