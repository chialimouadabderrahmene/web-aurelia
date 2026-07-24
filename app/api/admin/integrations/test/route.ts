import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { validateEcotrackToken } from "@/lib/ecotrack";

export async function POST() {
  const auth = await requireAdmin("integrations");
  if ("error" in auth) return auth.error;

  const result = await validateEcotrackToken();
  return NextResponse.json(result);
}
