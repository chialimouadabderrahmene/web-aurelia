import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const auth = await requireAdmin("reports");
  if ("error" in auth) return auth.error;

  const products = await prisma.product.findMany({
    orderBy: { nameEn: "asc" },
    select: { sku: true, nameEn: true, category: true, stockQty: true, price: true, costPrice: true, isPublished: true },
  });

  const csv = toCsv(
    products.map((p) => ({
      sku: p.sku,
      name: p.nameEn,
      category: p.category,
      stockQty: p.stockQty,
      price: p.price,
      costPrice: p.costPrice,
      published: p.isPublished ? "yes" : "no",
    })),
    ["sku", "name", "category", "stockQty", "price", "costPrice", "published"]
  );

  return csvResponse("stock-levels.csv", csv);
}
