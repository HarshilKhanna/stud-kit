import type { Metadata } from "next";
import { DM_Sans, Newsreader, Manrope } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { SearchProvider } from "@/context/SearchContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  adjustFontFallback: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans-alt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudentKit",
  description: "Everything you need. Nothing you don't.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${newsreader.variable} ${manrope.variable} font-sans antialiased`}
      >
        <DataProvider>
          <SearchProvider>{children}</SearchProvider>
        </DataProvider>
      </body>
    </html>
  );
}
