import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
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
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      price: p.price,
      image: p.images[0]?.url ?? null,
    })),
  });
}
