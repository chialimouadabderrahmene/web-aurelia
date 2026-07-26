import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import CartDrawerLazy from "@/components/CartDrawerLazy";
import CartTracker from "@/components/CartTracker";
import MetaPixel from "@/components/MetaPixel";
import { Locale, defaultLocale, isLocale } from "@/lib/i18n/config";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <>
      <MetaPixel />
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <Footer locale={locale} />
      <BottomNav />
      <CartDrawerLazy />
      <CartTracker />
    </>
  );
}
