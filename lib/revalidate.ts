import { revalidatePath } from "next/cache";

export function revalidateProductPages(slug?: string) {
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/collection");
  revalidatePath("/ar/collection");
  if (slug) {
    revalidatePath(`/en/product/${slug}`);
    revalidatePath(`/ar/product/${slug}`);
  }
}

export function revalidateContentPages() {
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/about");
  revalidatePath("/ar/about");
  revalidatePath("/en/faq");
  revalidatePath("/ar/faq");
  revalidatePath("/en/reviews");
  revalidatePath("/ar/reviews");
}
