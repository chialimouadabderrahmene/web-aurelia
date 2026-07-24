import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Markazi_Text, Cairo, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const admin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-admin",
  display: "swap",
});

const displayAr = Markazi_Text({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

const bodyAr = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURELIA — Quiet Luxury for Every Woman",
  description:
    "AURELIA is a premium handbag maison — minimal, elegant, timeless. Shop the collection with cash on delivery across Algeria.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${displayAr.variable} ${bodyAr.variable} ${admin.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
