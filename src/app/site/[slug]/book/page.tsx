import { notFound } from "next/navigation";
import { getSite } from "@/lib/server/site";
import { BookingCalendar } from "@/components/site/BookingCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: `Book · ${c.dealershipName}` } : { title: "Site not found" };
}

export default async function BookPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const sp = await searchParams;
  const listingId = typeof sp.listing === "string" ? sp.listing : undefined;
  return <BookingCalendar slug={slug} config={config} listingId={listingId} />;
}
