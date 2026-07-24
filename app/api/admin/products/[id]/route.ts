import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { canAccess } from "@/lib/auth";
import { productSchema } from "@/lib/productSchema";
import { revalidateProductPages } from "@/lib/revalidate";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { colors: true, images: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canAccess(auth.session.role, "finance")) {
    const { costPrice, materialCost, packagingCost, adsCost, otherCost, ...rest } = product;
    return NextResponse.json({ product: rest });
  }

  return NextResponse.json({ product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const duplicateSlug = await prisma.product.findFirst({
    where: { slug: data.slug, NOT: { id } },
  });
  if (duplicateSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  const duplicateSku = await prisma.product.findFirst({
    where: { sku: data.sku, NOT: { id } },
  });
  if (duplicateSku) {
    return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
  }

  const canEditCosts = canAccess(auth.session.role, "finance");
  const costFields = canEditCosts
    ? {
        materialCost: data.materialCost,
        packagingCost: data.packagingCost,
        adsCost: data.adsCost,
        otherCost: data.otherCost,
        costPrice: data.materialCost + data.packagingCost + data.adsCost + data.otherCost,
      }
    : {};

  const product = await prisma.$transaction(async (tx) => {
    await tx.productColor.deleteMany({ where: { productId: id } });
    await tx.productImage.deleteMany({ where: { productId: id } });

    return tx.product.update({
      where: { id },
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
        colors: { create: data.colors.map((c, i) => ({ ...c, sortOrder: i })) },
        images: { create: data.images.map((img, i) => ({ url: img.url, sortOrder: i })) },
      },
      include: { colors: true, images: true },
    });
  });

  revalidateProductPages(product.slug);

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "PRODUCT_UPDATE",
    entityType: "Product",
    entityId: product.id,
    summary: `Updated product "${product.nameEn}"`,
  });

  return NextResponse.json({ product });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await prisma.product.delete({ where: { id } });
  revalidateProductPages(deleted.slug);

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "PRODUCT_DELETE",
    entityType: "Product",
    entityId: id,
    summary: `Deleted product "${deleted.nameEn}"`,
  });

  return NextResponse.json({ ok: true });
}
