"use client";

import { useState } from "react";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { MessageSquare } from "lucide-react";

const FILTERS = [
  { k: "all", label: "All" }, { k: "unread", label: "Unread" }, { k: "sms", label: "SMS" }, { k: "email", label: "Email" }, { k: "messenger", label: "Messenger" },
] as const;

export default function InboxPage() {
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  return (
    <>
      <Topbar title="Inbox" />
      <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-n200 bg-n50">
          <div className="border-b border-n200 p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="h-9 w-full rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <div className="mt-2 flex items-center gap-1">
              {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-7 rounded-md px-2 text-[11.5px] font-medium transition", filter === f.k ? "bg-brand text-white" : "text-n600 hover:bg-n100")}>{f.label}</button>)}
            </div>
          </div>
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div>
              <p className="text-[13px] font-semibold text-n800">No conversations yet</p>
              <p className="mt-1 text-[12px] text-n500">SMS, email and Messenger threads land here.</p>
            </div>
          </div>
        </aside>

        <div className="grid flex-1 place-items-center bg-white">
          <div className="max-w-[36ch] text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><MessageSquare className="h-6 w-6" /></span>
            <p className="text-[15px] font-semibold text-n900">Your unified inbox</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-n500">Every customer message — SMS, email, Messenger and web chat — in one thread. Krakd AI drafts replies; you approve or let it run. Conversations appear as leads come in.</p>
          </div>
        </div>
      </div>
    </>
  );
}
