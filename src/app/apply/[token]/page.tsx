import { CreditAppClient } from "./CreditAppClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Credit application" };

export default async function ApplyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CreditAppClient token={token} />;
}
