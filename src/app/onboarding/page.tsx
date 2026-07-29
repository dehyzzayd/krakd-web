import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Get set up — Krakd",
  description: "Set up your Krakd business workspace.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
