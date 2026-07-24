import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import Reveal from "@/components/Reveal";
import ReviewCard from "@/components/ReviewCard";

export const revalidate = 60;

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const reviews = await prisma.review.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <p className="eyebrow">{dict.reviewsSection.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {dict.reviewsSection.title}
        </h1>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={Math.min(i * 0.05, 0.3)}>
            <ReviewCard review={{ name: r.authorName, rating: r.rating, text: r.text, product: r.product ?? undefined }} />
          </Reveal>
        ))}
        {reviews.length === 0 && <p className="font-body text-sm text-ink/40">No reviews yet.</p>}
      </div>
    </section>
  );
}
