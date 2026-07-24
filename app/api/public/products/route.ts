import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/publicProducts";

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({ products });
}
