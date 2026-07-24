import { getAllProducts } from "@/lib/publicProducts";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import CollectionGrid from "@/components/CollectionGrid";
import Reveal from "@/components/Reveal";

export const revalidate = 60;

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const products = await getAllProducts();

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <p className="eyebrow">{dict.collectionPage.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {dict.collectionPage.title}
        </h1>
      </Reveal>
      <CollectionGrid
        products={products}
        bestSellerSlugs={products.filter((p) => p.isBestSeller).map((p) => p.slug)}
        newSlugs={products.filter((p) => p.isNew).map((p) => p.slug)}
      />
    </section>
  );
}
