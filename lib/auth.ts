import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export type AdminRole = "OWNER" | "CONFIRMATION_AGENT" | "STOCK_MANAGER" | "FINANCE_MANAGER";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

const COOKIE_NAME = "aurelia_admin_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export const rolePermissions: Record<AdminRole, string[]> = {
  OWNER: ["products", "orders", "stock", "users", "finance", "customers", "marketing", "earnings", "integrations", "purchasing", "audit", "reports", "content", "live"],
  CONFIRMATION_AGENT: ["orders", "customers", "earnings"],
  STOCK_MANAGER: ["products", "stock", "purchasing"],
  FINANCE_MANAGER: ["finance", "earnings", "reports"],
};

export function canAccess(role: AdminRole, area: string): boolean {
  return rolePermissions[role].includes(area);
}
