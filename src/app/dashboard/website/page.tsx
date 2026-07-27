"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { OverviewPanel, TemplatePanel, BrandingPanel, HomepagePanel, ContactPanel, PagesPanel, NavbarPanel, SidebarPanel, VehiclePanel, DomainPanel, PublishPanel, type Web } from "@/components/app/website/panels";
import { LayoutDashboard, Palette, Image as ImageIcon, Home, Menu, PanelRight, Phone, FileText, Car, Globe, Rocket } from "lucide-react";

const SECTIONS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard, group: "Set up" },
  { id: "design", label: "Template", Icon: Palette, group: "Set up" },
  { id: "branding", label: "Branding", Icon: ImageIcon, group: "Design" },
  { id: "homepage", label: "Homepage", Icon: Home, group: "Design" },
  { id: "navbar", label: "Navbar menu", Icon: Menu, group: "Design" },
  { id: "pages", label: "Pages", Icon: FileText, group: "Design" },
  { id: "sidebar", label: "Page sidebar", Icon: PanelRight, group: "Design" },
  { id: "contact", label: "Contact & team", Icon: Phone, group: "Design" },
  { id: "vehicle", label: "Vehicle page", Icon: Car, group: "Design" },
  { id: "domain", label: "Domain", Icon: Globe, group: "Launch" },
  { id: "publish", label: "Preview & publish", Icon: Rocket, group: "Launch" },
] as const;
const GROUPS = ["Set up", "Design", "Launch"];

export default function WebsitePage() {
  const { data, loading, reload } = useApi<Web>("/website");
  const [tab, setTab] = useState<string>("overview");

  const panel = (w: Web) => {
    switch (tab) {
      case "design": return <TemplatePanel w={w} reload={reload} />;
      case "branding": return <BrandingPanel w={w} reload={reload} />;
      case "homepage": return <HomepagePanel w={w} reload={reload} />;
      case "contact": return <ContactPanel w={w} reload={reload} />;
      case "pages": return <PagesPanel w={w} reload={reload} />;
      case "navbar": return <NavbarPanel w={w} reload={reload} />;
      case "sidebar": return <SidebarPanel w={w} reload={reload} />;
      case "vehicle": return <VehiclePanel w={w} reload={reload} />;
      case "domain": return <DomainPanel w={w} reload={reload} />;
      case "publish": return <PublishPanel w={w} reload={reload} />;
      default: return <OverviewPanel w={w} reload={reload} go={setTab} />;
    }
  };

  return (
    <>
      <Topbar title="Website" />
      <AppMain>
        <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
          {/* secondary editor sidebar */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
              {GROUPS.map((g) => (
                <div key={g} className="lg:space-y-1">
                  <p className="hidden px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-n400 lg:block">{g}</p>
                  {SECTIONS.filter((s) => s.group === g).map((s) => {
                    const active = tab === s.id;
                    return (
                      <button key={s.id} onClick={() => setTab(s.id)} className={cn("inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition lg:flex lg:w-full", active ? "bg-brand-soft text-brand" : "text-n600 hover:bg-n100 hover:text-n900")}>
                        <s.Icon className="h-4 w-4 shrink-0" />{s.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* panel */}
          <div className="min-w-0">
            {loading && !data ? <div className="py-16 text-center text-[13px] text-n500">Loading…</div> : data ? panel(data) : null}
          </div>
        </div>
      </AppMain>
    </>
  );
}
