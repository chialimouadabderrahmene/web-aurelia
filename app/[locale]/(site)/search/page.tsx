import { searchProducts } from "@/lib/publicProducts";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { q = "" } = await searchParams;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const isAr = locale === "ar";

  const products = await searchProducts(q);

  return (
    <section className="container-aurelia py-14 md:py-20">
      <p className="eyebrow">{isAr ? "بحث" : "Search"}</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        {isAr ? `نتائج البحث عن "${q}"` : `Results for "${q}"`}
      </h1>
      <p className="mt-2 font-body text-sm text-ink/50">
        {isAr ? `${products.length} نتيجة` : `${products.length} result${products.length === 1 ? "" : "s"}`}
      </p>

      {products.length === 0 ? (
        <p className="mt-16 text-center font-body text-sm text-ink/40">{dict.collectionPage.empty}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i * 0.06, 0.3)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
