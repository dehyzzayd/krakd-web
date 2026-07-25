import type { Metadata } from "next";
import {
  AuthShell,
  Field,
  OrDivider,
  SocialRow,
  BTN_PRIMARY,
} from "@/components/auth/AuthScaffold";

export const metadata: Metadata = {
  title: "Log in — Krakd",
  description: "Sign in to your Krakd dealership.",
};

function Quote() {
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-sm">
      <p className="text-[17px] leading-[1.5] text-white/90">
        &ldquo;We replaced five vendors with Krakd and sold more cars the first
        month. The AI never sleeps.&rdquo;
      </p>
      <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.1em] text-white/55">
        Marcus R. · Downtown Auto
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      aside={
        <>
          <h2 className="max-w-[12ch] text-[52px] font-semibold leading-[0.98] tracking-[-0.03em] text-white xl:text-[60px]">
            Welcome back to Krakd
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.55] text-white/75">
            Pick up where you left off — your pipeline, your inventory, your AI,
            all working.
          </p>
          <div className="mt-10">
            <Quote />
          </div>
        </>
      }
    >
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Welcome back. Enter your details to continue.
        </p>

        <div className="mt-8">
          <SocialRow />
        </div>
        <div className="my-7">
          <OrDivider />
        </div>

        <form className="space-y-5">
          <Field id="email" label="Email" type="email" placeholder="john@dealership.com" autoComplete="email" />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            trailing={
              <a href="/reset" className="text-[13px] font-medium text-muted hover:text-ink">
                Forgot?
              </a>
            }
          />
          <button type="submit" className={`${BTN_PRIMARY} mt-2`}>
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-muted">
          New to Krakd?{" "}
          <a href="/signup" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">
            Create an account
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
