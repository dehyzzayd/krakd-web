import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return (
    <>
      <Topbar crumbs={[{ label: "Campaigns", href: "/dashboard/marketing/campaigns" }, { label: "Campaign" }]} />
      <AppMain>
        <div className="py-16 text-center">
          <p className="text-[14px] font-semibold text-n800">Campaign not found</p>
          <p className="mx-auto mt-1 max-w-[38ch] text-[12.5px] text-n500">Launch a campaign and its performance — spend, leads, cost per sold car — shows up here.</p>
          <Link href="/dashboard/marketing/campaigns" className="mt-3 inline-block text-[13px] font-semibold text-brand">← All campaigns</Link>
        </div>
      </AppMain>
    </>
  );
}
