"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { WidgetTab } from "@/components/app/krakdai/WidgetTab";
import { ChatbotTab } from "@/components/app/krakdai/ChatbotTab";
import { BehaviorTab } from "@/components/app/krakdai/BehaviorTab";
import { ActivityTab } from "@/components/app/krakdai/ActivityTab";

const TABS = [
  { id: "widget", label: "Chat widget" },
  { id: "chatbot", label: "Chatbot" },
  { id: "behavior", label: "Behavior" },
  { id: "activity", label: "Activity" },
] as const;

export default function KrakdAIPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("widget");
  const [dirty, setDirty] = useState(false);

  return (
    <>
      <Topbar title="Krakd AI" />
      <div className="w-full px-6 py-6">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">Krakd AI</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />Live on 1 site</span>
            </div>
            <p className="mt-1 text-[13px] text-n500">Your AI lead bot — install the widget, tune the agent, watch it work.</p>
          </div>
          <button onClick={() => setDirty(false)} disabled={!dirty} className={cn("h-9 rounded-md px-4 text-[13px] font-semibold transition", dirty ? "btn-brand" : "border border-n200 bg-white text-n400")}>{dirty ? "Publish changes" : "Saved"}</button>
        </div>

        {/* tabs */}
        <div className="mt-5 flex items-center gap-6 overflow-x-auto border-b border-n200">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("-mb-px whitespace-nowrap border-b-2 pb-2.5 pt-1 text-[13.5px] transition", on ? "border-brand font-semibold text-brand" : "border-transparent font-medium text-n500 hover:text-n800")}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* panels */}
        <div className="pt-6" onChange={() => setDirty(true)} onClick={() => { if (tab !== "activity") setDirty(true); }}>
          {tab === "widget" && <WidgetTab />}
          {tab === "chatbot" && <ChatbotTab />}
          {tab === "behavior" && <BehaviorTab />}
          {tab === "activity" && <ActivityTab />}
        </div>
      </div>
    </>
  );
}
