import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Oswald } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Krakd — The Automotive Operating System",
  description:
    "Inventory, CRM, AI sales employees, marketing, finance and analytics. One platform. One login. Built for independent dealers.",
  metadataBase: new URL("https://krakd.io"),
  openGraph: {
    title: "Krakd — The Automotive Operating System",
    description:
      "One platform to run the entire dealership. AI built into every workflow.",
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
      className={`${GeistSans.variable} ${GeistMono.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
