import type { Metadata } from "next";
import { AuthShell, StepCards } from "@/components/auth/AuthScaffold";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign up — Krakd",
  description: "Create your Krakd account and run your whole business from one screen.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      aside={
        <>
          <h2 className="max-w-[12ch] text-[52px] font-semibold leading-[0.98] tracking-[-0.03em] text-white xl:text-[60px]">
            Get started with Krakd
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.55] text-white/75">
            Three quick steps to a dealership that runs itself. Import your
            stock, connect your channels, start selling.
          </p>
          <div className="mt-10">
            <StepCards
              steps={[
                { label: "Create your account", active: true },
                { label: "Import your inventory" },
                { label: "Connect your channels" },
              ]}
            />
          </div>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
