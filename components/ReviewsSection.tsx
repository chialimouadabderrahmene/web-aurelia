"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import ReviewCard, { Review } from "./ReviewCard";
import Reveal from "./Reveal";

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const { dict } = useLocale();

  if (reviews.length === 0) return null;

  return (
    <section className="bg-sand py-24 md:py-32">
      <div className="container-aurelia">
        <Reveal className="text-center">
          <p className="eyebrow">{dict.reviewsSection.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
            {dict.reviewsSection.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-4">
          {reviews.map((r, i) => (
            <Reveal key={r.name + i} delay={i * 0.1}>
              <ReviewCard review={r} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
