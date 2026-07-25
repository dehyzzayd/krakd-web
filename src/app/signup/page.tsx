import type { Metadata } from "next";
import {
  AuthShell,
  StepCards,
  Field,
  OrDivider,
  SocialRow,
  BTN_PRIMARY,
} from "@/components/auth/AuthScaffold";

export const metadata: Metadata = {
  title: "Sign up — Krakd",
  description: "Create your Krakd account and run the whole dealership from one screen.",
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
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Enter your details to get started — no card required.
        </p>

        <div className="mt-8">
          <SocialRow />
        </div>
        <div className="my-7">
          <OrDivider />
        </div>

        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field id="firstName" label="First name" placeholder="John" autoComplete="given-name" />
            <Field id="lastName" label="Last name" placeholder="Francisco" autoComplete="family-name" />
          </div>
          <Field id="email" label="Email" type="email" placeholder="john@dealership.com" autoComplete="email" />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="new-password"
            hint="Must be at least 8 characters"
          />
          <a href="/onboarding" className={`${BTN_PRIMARY} mt-2`}>
            Create account
          </a>
        </form>

        <p className="mt-6 text-center text-[14px] text-muted">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">
            Log in
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
