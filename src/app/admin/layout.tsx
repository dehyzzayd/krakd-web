import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Krakd — Internal Operations" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable} app-scope`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
