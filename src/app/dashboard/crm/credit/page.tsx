"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";

const FILTERS = [
  { k: "all", label: "All" }, { k: "submitted", label: "Submitted" }, { k: "approved", label: "Approved" }, { k: "declined", label: "Declined" },
] as const;

export default function CreditAppsPage() {
  const [filter, setFilter] = useState<string>("all");

  return (
    <>
      <Topbar title="Credit applications" action={{ label: "New application" }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Applications", "0"], ["Approved", "0"], ["Avg FICO", "—"], ["Financed", "$0"]].map(([l, v]) => (
            <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
          ))}
        </div>

        <div className="mb-3 flex w-max items-center gap-1 rounded-lg border border-n200 bg-white p-0.5">
          {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-8 rounded-[7px] px-3 text-[12.5px] font-medium transition", filter === f.k ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{f.label}</button>)}
        </div>

        <Card>
          <div className="px-4 py-16 text-center">
            <p className="text-[14px] font-semibold text-n800">No credit applications yet</p>
            <p className="mx-auto mt-1 max-w-[44ch] text-[12.5px] text-n500">When a buyer submits a finance application — in-store or through Krakd AI — it lands here with their credit decision and tier.</p>
          </div>
        </Card>
      </AppMain>
    </>
  );
}
