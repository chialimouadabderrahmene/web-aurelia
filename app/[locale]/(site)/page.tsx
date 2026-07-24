import Hero from "@/components/Hero";
import CollectionPreview from "@/components/CollectionPreview";
import FeaturedProducts from "@/components/FeaturedProducts";
import Editorial from "@/components/Editorial";
import InstagramGrid from "@/components/InstagramGrid";
import ReviewsSection from "@/components/ReviewsSection";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const PREVIEW_CATEGORIES = ["SHOULDER_BAG", "TOTE", "CLUTCH", "CROSSBODY"] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const [reviews, content, categoryProducts, galleryProducts] = await Promise.all([
    prisma.review.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.siteContent.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
      select: { heroVideoUrl: true },
    }),
    Promise.all(
      PREVIEW_CATEGORIES.map((category) =>
        prisma.product.findFirst({
          where: { category, isPublished: true },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          orderBy: { createdAt: "desc" },
        })
      )
    ),
    prisma.product.findMany({
      where: { isPublished: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const categoryImages: Record<string, string | null> = {};
  PREVIEW_CATEGORIES.forEach((category, i) => {
    categoryImages[category] = categoryProducts[i]?.images[0]?.url ?? null;
  });

  const galleryImages = galleryProducts.map((p) => p.images[0]?.url).filter((u): u is string => !!u);
  const editorialImage = galleryImages[1] ?? galleryImages[0] ?? null;

  return (
    <>
      <Hero videoUrl={content.heroVideoUrl} />
      <CollectionPreview categoryImages={categoryImages} />
      <FeaturedProducts locale={locale} />
      <Editorial image={editorialImage} />
      <InstagramGrid images={galleryImages} />
      <ReviewsSection
        reviews={reviews.map((r) => ({ name: r.authorName, rating: r.rating, text: r.text, product: r.product ?? undefined }))}
      />
    </>
  );
}
