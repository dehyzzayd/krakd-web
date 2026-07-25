import type { Metadata } from "next";
import {
  AuthShell,
  Field,
  BTN_PRIMARY,
} from "@/components/auth/AuthScaffold";

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
            Drop in your email and we&apos;ll send a secure link to set a new
            password. You&apos;ll be back to selling in a minute.
          </p>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">
              Secure link · expires in 30 min
            </span>
          </div>
        </>
      }
    >
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">
          Reset your password
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>

        <form className="mt-8 space-y-5">
          <Field
            id="email"
            label="Email"
            type="email"
            placeholder="john@dealership.com"
            autoComplete="email"
          />
          <button type="submit" className={`${BTN_PRIMARY} mt-2`}>
            Send reset link
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-muted">
          Remembered it?{" "}
          <a href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">
            Back to sign in
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
