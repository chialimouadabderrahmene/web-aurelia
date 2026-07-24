import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import Reveal from "@/components/Reveal";
import FaqAccordion from "@/components/FaqAccordion";

export const revalidate = 60;

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const isAr = locale === "ar";
  const dict = getDictionary(locale);

  const items = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <p className="eyebrow">{dict.faq.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{dict.faq.title}</h1>
      </Reveal>

      <FaqAccordion
        items={items.map((i) => ({
          q: isAr ? i.questionAr : i.questionEn,
          a: isAr ? i.answerAr : i.answerEn,
        }))}
      />
    </section>
  );
}
