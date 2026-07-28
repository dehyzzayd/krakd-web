import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sidebar } from "@/components/app/Sidebar";
import { SidebarProvider } from "@/components/app/SidebarContext";
import { ImpersonationBanner } from "@/components/app/ImpersonationBanner";

export const metadata: Metadata = {
  title: "Dashboard — Krakd",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable} app-scope min-h-dvh`}>
      <ImpersonationBanner />
      <SidebarProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}
