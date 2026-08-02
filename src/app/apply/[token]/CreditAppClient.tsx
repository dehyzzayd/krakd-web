"use client";

import { useEffect, useState } from "react";
import { CreditAppForm } from "@/components/site/CreditAppForm";
import type { CreditConfig } from "@/lib/creditApp";
import { Loader2 } from "lucide-react";

type Data = { config: CreditConfig; consentText: string; disclaimerText: string; business: { name: string; brandColor: string | null; logoUrl: string | null; phone: string | null } };

export function CreditAppClient({ token }: { token: string }) {
  const [d, setD] = useState<Data | null | "missing">(null);
  useEffect(() => {
    fetch(`/api/v1/public/credit-app/${token}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setD("missing"));
  }, [token]);

  if (d === null) return <div className="grid min-h-screen place-items-center bg-[#eef1f5] text-[13px] text-[#94a3b8]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;
  if (d === "missing") return <div className="grid min-h-screen place-items-center bg-[#eef1f5] text-[14px] text-[#475569]">This application form isn&apos;t available.</div>;

  return (
    <div className="min-h-screen bg-[#eef1f5] px-4 py-10">
      <CreditAppForm token={token} config={d.config} consentText={d.consentText} disclaimerText={d.disclaimerText} business={d.business} />
    </div>
  );
}
