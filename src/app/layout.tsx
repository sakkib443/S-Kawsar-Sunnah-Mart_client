import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { brandCssVariables, brandFaviconDataUri, brandFontsHref } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.skawsarsunnahmart.com"),
  title: {
    default: "S Kawsar Sunnah Mart — Your trusted online marketplace",
    template: "%s | S Kawsar Sunnah Mart",
  },
  description: "Shop quality products at the best prices with S Kawsar Sunnah Mart, your trusted online marketplace in Bangladesh.",
  keywords: ["s kawsar sunnah mart", "skawsarsunnahmart", "online shopping", "ecommerce", "bangladesh", "marketplace", "best deals", "products"],
  applicationName: "S Kawsar Sunnah Mart",
  alternates: { canonical: "/" },
  // Real brand emblem (mosque + book + arch, no wordmark — the full lockup's
  // text is illegible at 16–32px). The generated brand-colour tile stays as a
  // fallback for clients that skip the PNG.
  icons: {
    icon: [
      { url: '/logo-mark.png', type: 'image/png', sizes: '512x512' },
      { url: brandFaviconDataUri() },
    ],
    apple: '/logo-mark.png',
  },
  openGraph: {
    type: "website",
    siteName: "S Kawsar Sunnah Mart",
    title: "S Kawsar Sunnah Mart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with S Kawsar Sunnah Mart, your trusted online marketplace in Bangladesh.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "S Kawsar Sunnah Mart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with S Kawsar Sunnah Mart, your trusted online marketplace in Bangladesh.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Brand palette — generated from the single BRAND_PRIMARY constant in
            src/config/brand.ts and inlined server-side, so every
            var(--color-primary) resolves on the first paint (no colour flash). */}
        <style id="brand-palette" dangerouslySetInnerHTML={{ __html: brandCssVariables() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Built from BRAND_FONT / BRAND_FONT_BANGLA in src/config/brand.ts, so
            changing the typeface there also changes what gets downloaded — no
            stale font request left behind. */}
        <link href={brandFontsHref()} rel="stylesheet" />
      </head>
      <body>
        <ReduxProvider>
          <ThemeProvider>
            <Toaster position="top-center" reverseOrder={false} />
            {children}
            <FloatingContact />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
