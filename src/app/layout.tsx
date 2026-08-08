import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Oswald, Fraunces } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

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
        {/* Decoy reinforcement: a device whose timezone is Morocco (e.g. a local user on
            a VPN) gets flagged so the edge serves the decoy. Runs before paint; respects
            the team bypass; sets the cookie once so it never loops. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var c=document.cookie;if(c.indexOf('krakd_bypass=1')>-1||c.indexOf('geo_ma=1')>-1)return;var tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'');if(tz==='Africa/Casablanca'||tz==='Africa/El_Aaiun'){document.cookie='geo_ma=1;path=/;max-age=31536000';location.reload();}}catch(e){}})();",
          }}
        />
        <SmoothScroll>{children}</SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
