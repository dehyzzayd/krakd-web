import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sidebar } from "@/components/app/Sidebar";
import { SidebarProvider } from "@/components/app/SidebarContext";
import { ImpersonationBanner } from "@/components/app/ImpersonationBanner";
import { BrandTheme } from "@/components/app/BrandTheme";

export const metadata: Metadata = {
  title: "Dashboard — Krakd",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable} app-scope flex h-dvh flex-col`}>
      <BrandTheme />
      <ImpersonationBanner />
      <SidebarProvider>
        {/* fixed-height shell: the row fills what's left under the banner; only <main> scrolls */}
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}
