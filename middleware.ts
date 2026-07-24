import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { locales, defaultLocale } from "@/lib/i18n/config";

const COOKIE_NAME = "aurelia_admin_session";

const areaByRole: Record<string, string[]> = {
  OWNER: ["products", "orders", "stock", "users", "finance", "customers", "marketing", "earnings", "integrations", "purchasing", "audit", "reports", "content"],
  CONFIRMATION_AGENT: ["orders", "customers", "earnings"],
  STOCK_MANAGER: ["products", "stock", "purchasing"],
  FINANCE_MANAGER: ["finance", "earnings", "reports"],
};

function sectionFor(pathname: string): string | null {
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/stock")) return "stock";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/marketing")) return "marketing";
  if (pathname.startsWith("/admin/finance")) return "finance";
  if (pathname.startsWith("/admin/earnings")) return "earnings";
  if (pathname.startsWith("/admin/integrations")) return "integrations";
  if (pathname.startsWith("/admin/purchasing")) return "purchasing";
  if (pathname.startsWith("/admin/audit-log")) return "audit";
  if (pathname.startsWith("/admin/reports")) return "reports";
  if (pathname.startsWith("/admin/content")) return "content";
  return null;
}

function detectLocale(req: NextRequest): string {
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }
  const acceptLang = req.headers.get("accept-language") ?? "";
  if (acceptLang.toLowerCase().startsWith("ar")) return "ar";
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- MediSmart landing (proxied via rewrites, no locale prefix) ---
  if (pathname === "/medismart" || pathname.startsWith("/medismart/")) {
    return NextResponse.next();
  }

  // --- Admin auth (unlocalized) ---
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;

      const section = sectionFor(pathname);
      if (section && !areaByRole[role]?.includes(section)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // --- Skip API + static internals ---
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- Locale prefixing for public site ---
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(req);
  const url = new URL(`/${locale}${pathname}`, req.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
