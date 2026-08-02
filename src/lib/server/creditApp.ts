import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { defaultConfig, DEFAULT_CONSENT, DEFAULT_DISCLAIMER } from "@/lib/creditApp";

/** Get-or-create the dealer's credit-app form config (with a stable public token). */
export async function ensureCreditConfig(dealershipId: string) {
  const existing = await prisma.creditAppConfig.findUnique({ where: { dealershipId } });
  if (existing) return existing;
  return prisma.creditAppConfig.create({
    data: {
      dealershipId,
      publicToken: randomUUID().replace(/-/g, ""),
      config: defaultConfig() as unknown as object,
      consentText: DEFAULT_CONSENT,
      disclaimerText: DEFAULT_DISCLAIMER,
    },
  });
}
