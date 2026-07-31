import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CatalogVector",
    template: "%s · CatalogVector",
  },
  description:
    "Outcome measurement of AI shopping-agent retrieval for technically-specified Shopify catalogs.",
  applicationName: "CatalogVector",
  authors: [{ name: "Dušan Knežević" }],
  keywords: [
    "Shopify",
    "Universal Commerce Protocol",
    "Global Catalog MCP",
    "AI shopping agents",
    "catalog retrieval",
    "pgvector",
  ],
  openGraph: {
    title: "CatalogVector",
    description:
      "Outcome measurement of AI shopping-agent retrieval for technically-specified Shopify catalogs.",
    type: "website",
  },
  robots: { index: false, follow: false }, // Phase 1: no public site yet
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
