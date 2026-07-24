import { getBestSellers } from "@/lib/publicProducts";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale } from "@/lib/i18n/config";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import LocalizedLink from "@/components/i18n/LocalizedLink";

export default async function FeaturedProducts({ locale }: { locale: Locale }) {
  const bestSellers = await getBestSellers();
  const dict = getDictionary(locale);

  if (bestSellers.length === 0) return null;

  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="container-aurelia">
        <Reveal className="flex items-end justify-between">
          <div>
            <p className="eyebrow">{dict.featured.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
              {dict.featured.title}
            </h2>
          </div>
          <LocalizedLink
            href="/collection?filter=best-sellers"
            className="hidden font-body text-[13px] uppercase tracking-widest2 text-ink/60 hover:text-ink md:block"
          >
            {dict.featured.viewAll}
          </LocalizedLink>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
          {bestSellers.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.1}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
