import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/publicProducts";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import ProductView from "@/components/ProductView";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug);

  return (
    <div className="pb-16">
      <ProductView product={product} />

      {related.length > 0 && (
        <section className="container-aurelia py-20">
          <Reveal>
            <p className="eyebrow">{dict.product.relatedEyebrow}</p>
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              {dict.product.relatedTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.1}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
