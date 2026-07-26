import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteView, type SiteData } from "@/components/site/SiteView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await prisma.website.findUnique({ where: { slug }, select: { status: true, dealershipId: true, headline: true } });
  if (!w || w.status !== "PUBLISHED") return { title: "Site not found" };
  const dealer = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true } });
  return { title: dealer?.name ?? "Dealership", description: w.headline };
}

export default async function PublicSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await prisma.website.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") notFound();

  const dealer = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true } });
  const rows = await prisma.vehicle.findMany({
    where: { dealershipId: w.dealershipId, status: { in: ["AVAILABLE", "RESERVED"] } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const vehicles = rows.map((v) => {
    const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
    return {
      id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim ?? "",
      price: Math.round(v.priceCents / 100), mileage: v.mileage, color: v.exteriorColor ?? "",
      drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "", image: photos[0] ?? null,
    };
  });

  const data: SiteData = {
    slug,
    dealershipName: dealer?.name ?? "Dealership",
    template: w.template,
    logoUrl: w.logoUrl, primaryColor: w.primaryColor,
    headline: w.headline, intro: w.intro, ctaLabel: w.ctaLabel,
    phone: w.phone, email: w.email, address: w.address, city: w.city, state: w.state, zip: w.zip,
    hours: (Array.isArray(w.hours) ? w.hours : []) as SiteData["hours"],
    socials: (w.socials ?? {}) as Record<string, string>,
    vehicles,
  };

  return <SiteView data={data} />;
}
