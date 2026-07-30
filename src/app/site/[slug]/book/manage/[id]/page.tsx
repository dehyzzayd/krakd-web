import { notFound } from "next/navigation";
import { getSite } from "@/lib/server/site";
import { ManageBooking } from "@/components/site/ManageBooking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Manage booking" };

export default async function ManageBookingPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  return <ManageBooking slug={slug} config={config} id={id} />;
}
