import { CreditAppDetail } from "./CreditAppDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreditAppDetail id={id} />;
}
