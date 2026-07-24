import { NextResponse } from "next/server";
import { getSession, canAccess, SessionPayload } from "@/lib/auth";

export async function requireAdmin(area?: string): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (area && !canAccess(session.role, area)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
