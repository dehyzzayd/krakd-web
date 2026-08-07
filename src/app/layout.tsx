import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Oswald, Fraunces } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";

const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Krakd — The Operating System for local business",
  description:
    "Catalog, CRM, AI sales employees, marketing, finance and analytics. One platform. One login. Built for automotive, real estate, services, retail and every local business.",
  metadataBase: new URL("https://krakd.io"),
  openGraph: {
    title: "Krakd — The Operating System for local business",
    description:
      "One platform to run your entire business. AI built into every workflow.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ebebeb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${oswald.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <SmoothScroll>{children}</SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
