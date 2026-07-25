import { notFound } from "next/navigation";
import { LEADS, leadProfile } from "@/lib/leads";
import { LeadWorkspace } from "@/components/app/LeadWorkspace";

export function generateStaticParams() {
  return LEADS.map((l) => ({ id: l.id }));
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = leadProfile(id);
  if (!p) notFound();
  return <LeadWorkspace p={p} />;
}
