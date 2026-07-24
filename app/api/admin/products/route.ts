import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { canAccess } from "@/lib/auth";
import { productSchema } from "@/lib/productSchema";
import { revalidateProductPages } from "@/lib/revalidate";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const products = await prisma.product.findMany({
    include: { colors: true, images: true },
    orderBy: { createdAt: "desc" },
  });

  const canSeeCosts = canAccess(auth.session.role, "finance");
  const sanitized = canSeeCosts
    ? products
    : products.map(({ costPrice, materialCost, packagingCost, adsCost, otherCost, ...rest }) => rest);

  return NextResponse.json({ products: sanitized });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const canEditCosts = canAccess(auth.session.role, "finance");

  const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) {
    return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
  }

  const costFields = canEditCosts
    ? {
        materialCost: data.materialCost,
        packagingCost: data.packagingCost,
        adsCost: data.adsCost,
        otherCost: data.otherCost,
        costPrice: data.materialCost + data.packagingCost + data.adsCost + data.otherCost,
      }
    : { costPrice: 0 };

  const product = await prisma.product.create({
    data: {
      slug: data.slug,
      sku: data.sku,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr,
      materialsEn: data.materialsEn,
      materialsAr: data.materialsAr,
      dimensions: data.dimensions,
      careEn: data.careEn,
      careAr: data.careAr,
      category: data.category,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      originCountry: data.originCountry,
      stockQty: data.stockQty,
      isBestSeller: data.isBestSeller,
      isNew: data.isNew,
      isPublished: data.isPublished,
      ...costFields,
      colors: {
        create: data.colors.map((c, i) => ({ ...c, sortOrder: i })),
      },
      images: {
        create: data.images.map((img, i) => ({ url: img.url, sortOrder: i })),
      },
    },
    include: { colors: true, images: true },
  });

  revalidateProductPages(product.slug);

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "PRODUCT_CREATE",
    entityType: "Product",
    entityId: product.id,
    summary: `Created product "${product.nameEn}" (SKU ${product.sku})`,
  });

  return NextResponse.json({ product }, { status: 201 });
}
