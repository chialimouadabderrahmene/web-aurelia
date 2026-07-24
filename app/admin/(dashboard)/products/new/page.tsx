import { getSession, canAccess } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const session = await getSession();
  const canEditCosts = !!session && canAccess(session.role, "finance");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Add Product</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm canEditCosts={canEditCosts} />
      </div>
    </div>
  );
}
