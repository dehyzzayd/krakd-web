import { QuoteView } from "@/components/site/QuoteView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your quote" };

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <QuoteView token={token} />;
}
