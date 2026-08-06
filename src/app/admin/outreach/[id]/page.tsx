import { OutreachDetailClient } from "@/components/admin/OutreachDetailClient";

export default async function OutreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OutreachDetailClient id={id} />;
}
