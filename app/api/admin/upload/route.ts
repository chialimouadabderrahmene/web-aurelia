import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/requireAdmin";

function sanitizeSlug(slug: string): string {
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return clean || "misc";
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("products");
  if ("error" in auth) return auth.error;

  const form = await req.formData();
  const file = form.get("file");
  const slugField = form.get("slug");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const slug = sanitizeSlug(typeof slugField === "string" ? slugField : "misc");

  const blob = await put(`products/${slug}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
