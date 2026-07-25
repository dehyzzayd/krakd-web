import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Sidebar } from "@/components/app/Sidebar";
import { SidebarProvider } from "@/components/app/SidebarContext";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard — Krakd",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plex.variable} ${plexMono.variable} app-scope flex min-h-dvh`}>
      <SidebarProvider>
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </SidebarProvider>
    </div>
  );
}
