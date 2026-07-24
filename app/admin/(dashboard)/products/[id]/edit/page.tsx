"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm, { ProductFormValues } from "@/components/admin/ProductForm";

const FINANCE_ROLES = new Set(["OWNER", "FINANCE_MANAGER"]);

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductFormValues | null>(null);
  const [canEditCosts, setCanEditCosts] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d) =>
        setProduct({
          ...d.product,
          colors: d.product.colors.map((c: { nameEn: string; nameAr: string; hex: string }) => ({
            nameEn: c.nameEn,
            nameAr: c.nameAr,
            hex: c.hex,
          })),
          images: d.product.images.map((i: { url: string }) => ({ url: i.url })),
        })
      );
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setCanEditCosts(FINANCE_ROLES.has(d.role)));
  }, [id]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Edit Product</h1>
      <div className="mt-6 max-w-3xl">
        {product ? (
          <ProductForm initial={product} canEditCosts={canEditCosts} />
        ) : (
          <p className="font-body text-sm text-ink/50">Loading…</p>
        )}
      </div>
    </div>
  );
}
