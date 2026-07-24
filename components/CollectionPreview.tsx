"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Reveal from "./Reveal";

const categories = [
  { key: "SHOULDER_BAG", slug: "shoulder-bag" },
  { key: "TOTE", slug: "tote" },
  { key: "CLUTCH", slug: "clutch" },
  { key: "CROSSBODY", slug: "crossbody" },
];

export default function CollectionPreview({
  categoryImages,
}: {
  categoryImages: Record<string, string | null>;
}) {
  const { dict } = useLocale();
  const available = categories.filter((cat) => categoryImages[cat.key]);

  if (available.length === 0) return null;

  return (
    <section className="container-aurelia py-24 md:py-32">
      <Reveal>
        <p className="eyebrow">{dict.collectionPreview.eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {dict.collectionPreview.title}
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {available.map((cat, i) => (
          <Reveal key={cat.slug} delay={i * 0.1}>
            <LocalizedLink
              href={`/collection?category=${cat.slug}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl3 bg-sand">
                <Image
                  src={categoryImages[cat.key]!}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.06]"
                />
              </div>
              <p className="mt-4 font-display text-lg text-ink">{dict.categories[cat.key as keyof typeof dict.categories]}</p>
            </LocalizedLink>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
