"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { OverviewPanel, TemplatePanel, DetailsPanel, DomainPanel, PublishPanel, type Web } from "@/components/app/website/panels";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "template", label: "Template" },
  { id: "details", label: "Details" },
  { id: "domain", label: "Domain" },
  { id: "publish", label: "Preview & publish" },
] as const;

export default function WebsitePage() {
  const { data, loading, reload } = useApi<Web>("/website");
  const [tab, setTab] = useState<string>("overview");

  return (
    <>
      <Topbar title="Website" />
      <AppMain>
        <div className="mb-5 flex flex-wrap gap-1 border-b border-n200">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("-mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition", tab === t.id ? "border-brand text-n900" : "border-transparent text-n500 hover:text-n800")}>{t.label}</button>
          ))}
        </div>

        {loading && !data ? (
          <div className="py-16 text-center text-[13px] text-n500">Loading…</div>
        ) : data ? (
          <>
            {tab === "overview" && <OverviewPanel w={data} reload={reload} go={setTab} />}
            {tab === "template" && <TemplatePanel w={data} reload={reload} />}
            {tab === "details" && <DetailsPanel w={data} reload={reload} />}
            {tab === "domain" && <DomainPanel w={data} reload={reload} />}
            {tab === "publish" && <PublishPanel w={data} reload={reload} />}
          </>
        ) : null}
      </AppMain>
    </>
  );
}
