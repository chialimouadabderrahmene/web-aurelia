import { cache } from "react";
import { prisma } from "@/lib/prisma";

const productInclude = {
  colors: { orderBy: { sortOrder: "asc" as const } },
  images: { orderBy: { sortOrder: "asc" as const } },
};

const getActiveFlashDiscounts = cache(async (): Promise<Record<string, number>> => {
  const now = new Date();
  const sales = await prisma.flashSale.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { products: true },
  });
  const map: Record<string, number> = {};
  for (const sale of sales) {
    for (const link of sale.products) {
      map[link.productId] = Math.max(map[link.productId] ?? 0, sale.discountPercent);
    }
  }
  return map;
});

function applyFlash<T extends { id: string; price: number }>(
  products: T[],
  discounts: Record<string, number>
): (T & { flashDiscountPercent: number | null; effectivePrice: number })[] {
  return products.map((p) => {
    const pct = discounts[p.id] ?? null;
    return {
      ...p,
      flashDiscountPercent: pct,
      effectivePrice: pct ? Math.round(p.price * (1 - pct / 100)) : p.price,
    };
  });
}

export async function getAllProducts() {
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    }),
    getActiveFlashDiscounts(),
  ]);
  return applyFlash(products, discounts);
}

export async function searchProducts(q: string) {
  if (q.trim().length < 2) return [];
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameAr: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { descriptionAr: { contains: q, mode: "insensitive" } },
        ],
      },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    }),
    getActiveFlashDiscounts(),
  ]);
  return applyFlash(products, discounts);
}

export async function getBestSellers() {
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, isBestSeller: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    }),
    getActiveFlashDiscounts(),
  ]);
  return applyFlash(products, discounts);
}

export async function getNewArrivals() {
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, isNew: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    }),
    getActiveFlashDiscounts(),
  ]);
  return applyFlash(products, discounts);
}

export const getProductBySlug = cache(async (slug: string) => {
  const [product, discounts] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: productInclude,
    }),
    getActiveFlashDiscounts(),
  ]);
  if (!product) return null;
  return applyFlash([product], discounts)[0];
});

export async function getRelatedProducts(slug: string, count = 3) {
  const [products, discounts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, NOT: { slug } },
      include: productInclude,
      take: count,
      orderBy: { createdAt: "desc" },
    }),
    getActiveFlashDiscounts(),
  ]);
  return applyFlash(products, discounts);
}

export type PublicProduct = Awaited<ReturnType<typeof getProductBySlug>>;

export async function getProductReviews(nameEn: string, nameAr: string, count = 6) {
  const specific = await prisma.review.findMany({
    where: { isActive: true, OR: [{ product: nameEn }, { product: nameAr }] },
    orderBy: { sortOrder: "asc" },
    take: count,
  });
  if (specific.length > 0) return specific;

  return prisma.review.findMany({
    where: { isActive: true, product: null },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
}

export async function getRecentOrdersForProduct(productId: string, count = 6) {
  const orders = await prisma.order.findMany({
    where: { items: { some: { productId } } },
    orderBy: { createdAt: "desc" },
    take: count,
    select: { customerName: true, wilaya: true, createdAt: true },
  });
  return orders.map((o) => ({
    firstName: o.customerName.trim().split(/\s+/)[0],
    wilaya: o.wilaya,
    createdAt: o.createdAt,
  }));
}
