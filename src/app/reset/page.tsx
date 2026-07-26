import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthScaffold";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = {
  title: "Reset password — Krakd",
  description: "Reset your Krakd password.",
};

export default function ResetPage() {
  return (
    <AuthShell
      aside={
        <>
          <h2 className="max-w-[13ch] text-[52px] font-semibold leading-[0.98] tracking-[-0.03em] text-white xl:text-[60px]">
            Forgot it? It happens.
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.55] text-white/75">
            Drop in your email and we&apos;ll send a secure link to set a new password. You&apos;ll be back to selling in a minute.
          </p>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">Secure link · expires in 30 min</span>
          </div>
        </>
      }
    >
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
