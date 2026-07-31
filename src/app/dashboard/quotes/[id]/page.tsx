import { QuoteBuilder } from "@/components/app/QuoteBuilder";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteBuilder id={id} />;
}
