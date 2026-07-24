import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import Reveal from "@/components/Reveal";

export const revalidate = 60;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const isAr = locale === "ar";

  const content = await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const stats = [
    { stat: content.aboutStatCustomers, label: isAr ? "عميلة سعيدة" : "Happy customers" },
    { stat: content.aboutStatWilayas, label: isAr ? "ولاية نوصل إليها" : "Wilayas delivered" },
    { stat: content.aboutStatRating, label: isAr ? "متوسط التقييم" : "Average rating" },
  ];

  return (
    <div>
      <section className="bg-sand py-24 md:py-32">
        <div className="container-aurelia text-center">
          <Reveal>
            <p className="eyebrow">{isAr ? content.aboutEyebrowAr : content.aboutEyebrowEn}</p>
            <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">
              {isAr ? content.aboutTitleAr : content.aboutTitleEn}
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="container-aurelia py-24 md:py-32">
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2">
          <Reveal>
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl3 bg-ink p-16">
              <Image
                src="https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/brand/logo.png"
                alt="AURELIA"
                width={280}
                height={280}
                className="h-full w-full object-contain"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="font-body text-base leading-relaxed text-ink/70">{isAr ? content.aboutP1Ar : content.aboutP1En}</p>
            <p className="mt-5 font-body text-base leading-relaxed text-ink/70">{isAr ? content.aboutP2Ar : content.aboutP2En}</p>
            <p className="mt-5 font-body text-base leading-relaxed text-ink/70">{isAr ? content.aboutP3Ar : content.aboutP3En}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-24 md:py-32">
        <div className="container-aurelia grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {stats.map((s) => (
            <Reveal key={s.label}>
              <p className="font-display text-5xl text-ink">{s.stat}</p>
              <p className="mt-2 font-body text-sm uppercase tracking-wide text-ink/50">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
